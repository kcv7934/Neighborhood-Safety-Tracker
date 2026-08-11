import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { userReports, officialReports } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { queryOfficialReportsFromDB } from "../data/officialReports.js";
import * as validation from "../data/validation.js";

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

  await userReportsCollection.insertMany(userReportData);
};

const seedOfficialReports = async () => {
  const officialReportsCollection = await officialReports();

  const officialReportData = await queryOfficialReportsFromDB();

  const formattedReports = officialReportData.map((report) => ({
    _id: new ObjectId(),
    nycComplaintNumber: report.cmplnt_num,
    borough: report.boro_nm,
    precinct: report.addr_pct_cd,
    latitude: report.latitude,
    longitude: report.longitude,
    category: validation.mapOfficialCrimeCategory(report.ofns_desc),
    crimeType: report.ofns_desc,
    crimeDescription: report.pd_desc,
    lawCategory: report.law_cat_cd,
    attemptedOrCompleted: report.crm_atpt_cptd_cd,
    dateOccurred: report.cmplnt_fr_dt
  }));

  await officialReportsCollection.insertMany(formattedReports);
};

const main = async () => {
  const db = await dbConnection();
  await db.dropDatabase();

  await seedUserReports();

  await seedOfficialReports();

  console.log("Database seeded successfully");

  await closeConnection();
};

main().catch(async (e) => {
  console.error("Could not seed database, something went wrong");
  console.error(e);

  await closeConnection();
});

export default main;