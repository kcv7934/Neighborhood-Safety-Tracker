import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { userReports } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

const seedUserReports = async () => {
  const userReportsCollection = await userReports();

  // TODO: temporary authorId until users collection is implemented
  const testAuthorId = new ObjectId("687000000000000000000001");
  const now = new Date();

  const userReportData = [
    {
      authorId: testAuthorId,
      category: "THEFT",
      address: "476 Fifth Avenue",
      borough: "MANHATTAN",
      description:
        "A person was seen checking the doors of several parked vehicles late at night.",
      latitude: 40.7532,
      longitude: -73.9822,
      createdAt: now,
      updatedAt: now,
    },
    {
      authorId: testAuthorId,
      category: "PUBLIC ORDER OFFENSE",
      address: "45 Atlantic Avenue",
      borough: "BROOKLYN",
      description:
        "A large disturbance involving loud shouting continued outside after midnight.",
      latitude: 40.6905,
      longitude: -73.9965,
      createdAt: now,
      updatedAt: now,
    },
  ];

const main = async () => {
  const db = await dbConnection();
  await db.dropDatabase();

  await seedUserReports();

  console.log("Database seeded successfully");

  await closeConnection();
};

main().catch(async (e) => {
  console.error("Could not seed database, something went wrong");
  console.error(error);

  await closeConnection();
});
