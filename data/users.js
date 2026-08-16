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
    age
) => {
    if (!firstName || !lastName || !username || !email || !state || !city || !age || !password) {
        throw new Error("All fields are required");
    }

    console.log("Creating user with data:", {
        password,
        email});

    firstName = validation.validateString(firstName, "firstName");
    lastName = validation.validateString(lastName, "lastName");
    username = validation.validateString(username, "username");
    email = validation.validateEmail(email);
    state = validation.validateString(state, "state");
    city = validation.validateString(city, "city");
    age = validation.validateNumber(age, "age", 0, 120);
    password = validation.validateString(password, "password");

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

    username = validation.validateString(username, "username");
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

    return { authenticated: true, userId: user._id.toString(), username: user.username };
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

    const validKeys = ["firstName", "lastName", "username", "email", "state", "city", "age"];
    updatedFields = validation.validateObjectKeys(updatedFields, validKeys);

    const usersCollection = await users();

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    if (updatedFields.username && updatedFields.username !== user.username) {
        const existingUser = await usersCollection.findOne({ username: updatedFields.username });

        if (existingUser) {
            throw new Error("Username already exists");
        }

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { username: updatedFields.username } }
        );
    }

    for (const key of Object.keys(updatedFields)) {
        if (key === "username") continue;

        if (updatedFields[key] !== user[key]) {
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { [key]: updatedFields[key] } }
            );
        }
    }

    return { userUpdated: true, userId: userId };
};