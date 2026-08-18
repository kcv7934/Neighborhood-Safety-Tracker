import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";
import * as validation from "./validation.js";
import { NotFoundError, ForbiddenError } from "./error.js";
import bcrypt from "bcrypt";

export const createUser = async (
  firstName,
  lastName,
  username,
  password,
  email,
  state,
  city,
  age,
) => {

  firstName = validation.validateName(firstName, "firstName");
  lastName = validation.validateName(lastName, "lastName");
  username = validation.validateUsername(username);
  email = validation.validateEmail(email);
  state = validation.validateState(state);
  city = validation.validateCity(city);
  age = validation.validateNumber(age, "age", 0, 120);
  password = validation.validatePassword(password);

  const usersCollection = await users();

  let existingUser = await usersCollection.findOne({ username: username });
  if (existingUser) {
    throw new Error("Username already exists");
  }

  existingUser = await usersCollection.findOne({ email: email });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    firstName,
    lastName,
    username,
    email,
    state,
    city,
    age,
    password: hashedPassword,
  };

  const insertInfo = await usersCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw new Error("Could not add user");
  }

  return { userInserted: true, userId: insertInfo.insertedId.toString() };
};

export const authenticateUser = async (username, password) => {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  username = validation.validateUsername(username)
  password = validation.validateString(password, "password");

  const usersCollection = await users();
  const user = await usersCollection.findOne({ username: username });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new ForbiddenError("Either the username or password is invalid");
  }

  return {
    authenticated: true,
    userId: user._id.toString(),
    username: user.username,
  };
};

export const getUserById = async (userId) => {
  userId = validation.validateId(userId, "userId");

  const usersCollection = await users();
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    userId: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    state: user.state,
    city: user.city,
    age: user.age,
  };
};

export const editUser = async (userId, updatedFields) => {
  userId = validation.validateId(userId, "userId");
  updatedFields = validation.validateObject(updatedFields, "updatedFields");

  const validKeys = ["firstName", "lastName", "email", "state", "city", "age"];
  updatedFields = validation.validateObjectKeys(updatedFields, validKeys);

  const usersCollection = await users();

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (updatedFields.firstName !== undefined) {
    updatedFields.firstName = validation.validateName(
      updatedFields.firstName,
      "firstName",
    );
  }

  if (updatedFields.lastName !== undefined) {
    updatedFields.lastName = validation.validateName(
      updatedFields.lastName,
      "lastName",
    );
  }

  if (updatedFields.email !== undefined) {
    updatedFields.email = validation.validateEmail(updatedFields.email);
  }

  if (updatedFields.state !== undefined) {
    updatedFields.state = validation.validateState(updatedFields.state);
  }

  if (updatedFields.city !== undefined) {
    updatedFields.city = validation.validateCity(updatedFields.city);
  }

  if (updatedFields.age !== undefined) {
    updatedFields.age = validation.validateNumber(
      updatedFields.age,
      "age",
      0,
      120,
    );
  }

  if (updatedFields.email !== undefined) {
    updatedFields.email = validation.validateEmail(updatedFields.email);

    const existingEmailUser = await usersCollection.findOne({
      email: updatedFields.email,
    });

    if (existingEmailUser && existingEmailUser._id.toString() !== userId) {
      throw new Error("Email already exists");
    }
  }

  let fieldChanged = false;

  for (const key of Object.keys(updatedFields)) {
    if (updatedFields[key] !== user[key]) {
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { [key]: updatedFields[key] } },
      );
      fieldChanged = true;
    }
  }

  if (!fieldChanged) {
    throw new Error("No fields were changed");
  }

  return { userUpdated: true, userId: userId };
};

export const deleteUser = async (userId) => {
  userId = validation.validateId(userId, "userId");

  const usersCollection = await users();
  const deletionInfo = await usersCollection.deleteOne({
    _id: new ObjectId(userId),
  });

  if (deletionInfo.deletedCount === 0) {
    throw new NotFoundError(
      "Could not delete user account. Please try again later.",
    );
  }

  return { userDeleted: true, userId: userId };
};
