import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import {
  userReports,
  officialReports,
  savedLocations,
} from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { queryOfficialReportsFromDB } from "../data/officialReports.js";
import * as validation from "../data/validation.js";

const seedUserReports = async () => {
  const userReportsCollection = await userReports();

  // TODO: temporary authorId until users collection is implemented
  const testAuthorId = new ObjectId("687000000000000000000001");

  const daysAgo = (days) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date;
  };

  const userReportData = [
    {
      authorId: testAuthorId,
      category: "THEFT",
      address: "476 Fifth Avenue",
      borough: "MANHATTAN",
      description: "A theft was reported at this location.",
      latitude: 40.7532,
      longitude: -73.9822,
      status: "visible",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      authorId: testAuthorId,
      category: "PUBLIC ORDER OFFENSE",
      address: "45 Atlantic Avenue",
      borough: "BROOKLYN",
      description: "A public disturbance was reported here.",
      latitude: 40.6905,
      longitude: -73.9965,
      status: "visible",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      authorId: testAuthorId,
      category: "ASSAULT",
      address: "120 Flatbush Avenue",
      borough: "BROOKLYN",
      description: "An assault was reported at this location.",
      latitude: 40.6845,
      longitude: -73.9776,
      status: "visible",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      authorId: testAuthorId,
      category: "HARASSMENT",
      address: "350 Fifth Avenue",
      borough: "MANHATTAN",
      description: "Harassment was reported at this location.",
      latitude: 40.7484,
      longitude: -73.9857,
      status: "visible",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      authorId: testAuthorId,
      category: "VANDALISM",
      address: "150 East 42nd Street",
      borough: "MANHATTAN",
      description: "Property was vandalized at this location.",
      latitude: 40.7517,
      longitude: -73.9755,
      status: "visible",
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    },
    {
      authorId: testAuthorId,
      category: "BURGLARY",
      address: "500 Bedford Avenue",
      borough: "BROOKLYN",
      description: "A burglary was reported at this location.",
      latitude: 40.7081,
      longitude: -73.9571,
      status: "visible",
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      authorId: testAuthorId,
      category: "ROBBERY",
      address: "90 Queens Boulevard",
      borough: "QUEENS",
      description: "A robbery was reported at this location.",
      latitude: 40.7282,
      longitude: -73.7949,
      status: "visible",
      createdAt: daysAgo(12),
      updatedAt: daysAgo(12),
    },
    {
      authorId: testAuthorId,
      category: "THEFT",
      address: "37-01 Main Street",
      borough: "QUEENS",
      description: "A bicycle was stolen at this location.",
      latitude: 40.7615,
      longitude: -73.8317,
      status: "visible",
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
    {
      authorId: testAuthorId,
      category: "MOTOR VEHICLE THEFT",
      address: "200 Fordham Road",
      borough: "BRONX",
      description: "A vehicle was stolen at this location.",
      latitude: 40.8622,
      longitude: -73.8971,
      status: "visible",
      createdAt: daysAgo(18),
      updatedAt: daysAgo(18),
    },
    {
      authorId: testAuthorId,
      category: "DRUG OFFENSE",
      address: "700 Grand Concourse",
      borough: "BRONX",
      description: "Drug activity was reported at this location.",
      latitude: 40.8216,
      longitude: -73.9255,
      status: "visible",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      authorId: testAuthorId,
      category: "WEAPONS OFFENSE",
      address: "1000 Southern Boulevard",
      borough: "BRONX",
      description: "A weapon was reported at this location.",
      latitude: 40.824,
      longitude: -73.891,
      status: "visible",
      createdAt: daysAgo(23),
      updatedAt: daysAgo(23),
    },
    {
      authorId: testAuthorId,
      category: "FRAUD",
      address: "60 Wall Street",
      borough: "MANHATTAN",
      description: "A fraud incident was reported here.",
      latitude: 40.7068,
      longitude: -74.009,
      status: "visible",
      createdAt: daysAgo(27),
      updatedAt: daysAgo(27),
    },
    {
      authorId: testAuthorId,
      category: "TRESPASSING",
      address: "400 Atlantic Avenue",
      borough: "BROOKLYN",
      description: "Trespassing was reported at this location.",
      latitude: 40.686,
      longitude: -73.978,
      status: "visible",
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    {
      authorId: testAuthorId,
      category: "TRAFFIC OFFENSE",
      address: "200 Queens Plaza",
      borough: "QUEENS",
      description: "A traffic offense was reported here.",
      latitude: 40.7506,
      longitude: -73.9402,
      status: "visible",
      createdAt: daysAgo(35),
      updatedAt: daysAgo(35),
    },
    {
      authorId: testAuthorId,
      category: "IMPAIRED DRIVING",
      address: "80 Richmond Terrace",
      borough: "STATEN ISLAND",
      description: "Impaired driving was reported here.",
      latitude: 40.6435,
      longitude: -74.0762,
      status: "visible",
      createdAt: daysAgo(40),
      updatedAt: daysAgo(40),
    },
    {
      authorId: testAuthorId,
      category: "ARSON",
      address: "120 Bay Street",
      borough: "STATEN ISLAND",
      description: "A fire was intentionally started here.",
      latitude: 40.6369,
      longitude: -74.076,
      status: "visible",
      createdAt: daysAgo(45),
      updatedAt: daysAgo(45),
    },
    {
      authorId: testAuthorId,
      category: "KIDNAPPING",
      address: "300 East Tremont Avenue",
      borough: "BRONX",
      description: "A kidnapping incident was reported here.",
      latitude: 40.847,
      longitude: -73.9,
      status: "visible",
      createdAt: daysAgo(50),
      updatedAt: daysAgo(50),
    },
    {
      authorId: testAuthorId,
      category: "SEXUAL OFFENSE",
      address: "100 Broadway",
      borough: "MANHATTAN",
      description: "A sexual offense was reported here.",
      latitude: 40.7075,
      longitude: -74.0113,
      status: "visible",
      createdAt: daysAgo(55),
      updatedAt: daysAgo(55),
    },
    {
      authorId: testAuthorId,
      category: "ASSAULT",
      address: "600 Atlantic Avenue",
      borough: "BROOKLYN",
      description: "An assault was reported at this location.",
      latitude: 40.6837,
      longitude: -73.9752,
      status: "visible",
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    },
    {
      authorId: testAuthorId,
      category: "ASSAULT",
      address: "160 Queens Boulevard",
      borough: "QUEENS",
      description: "An assault was reported at this location.",
      latitude: 40.723,
      longitude: -73.845,
      status: "visible",
      createdAt: daysAgo(65),
      updatedAt: daysAgo(65),
    },
    {
      authorId: testAuthorId,
      category: "THEFT",
      address: "250 Bedford Avenue",
      borough: "BROOKLYN",
      description: "An item was stolen at this location.",
      latitude: 40.7161,
      longitude: -73.9596,
      status: "visible",
      createdAt: daysAgo(70),
      updatedAt: daysAgo(70),
    },
    {
      authorId: testAuthorId,
      category: "ROBBERY",
      address: "110 East 125th Street",
      borough: "MANHATTAN",
      description: "A robbery was reported at this location.",
      latitude: 40.8043,
      longitude: -73.9375,
      status: "visible",
      createdAt: daysAgo(80),
      updatedAt: daysAgo(80),
    },
    {
      authorId: testAuthorId,
      category: "HARASSMENT",
      address: "100 Jamaica Avenue",
      borough: "QUEENS",
      description: "Harassment was reported at this location.",
      latitude: 40.7027,
      longitude: -73.8005,
      status: "visible",
      createdAt: daysAgo(90),
      updatedAt: daysAgo(90),
    },
    {
      authorId: testAuthorId,
      category: "VANDALISM",
      address: "300 Richmond Avenue",
      borough: "STATEN ISLAND",
      description: "Property was vandalized at this location.",
      latitude: 40.589,
      longitude: -74.164,
      status: "visible",
      createdAt: daysAgo(100),
      updatedAt: daysAgo(100),
    },
    {
      authorId: testAuthorId,
      category: "FRAUD",
      address: "900 Grand Concourse",
      borough: "BRONX",
      description: "A fraud incident was reported here.",
      latitude: 40.827,
      longitude: -73.922,
      status: "visible",
      createdAt: daysAgo(110),
      updatedAt: daysAgo(110),
    },

    // Hidden report for testing
    {
      authorId: testAuthorId,
      category: "ASSAULT",
      address: "500 Flatbush Avenue",
      borough: "BROOKLYN",
      description: "This is a hidden test report.",
      latitude: 40.661,
      longitude: -73.961,
      status: "hidden",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
  ];

  await userReportsCollection.insertMany(userReportData);
};

const seedSavedLocations = async () => {
  const savedLocationsCollection = await savedLocations();

  // Same temporary user used for user reports
  const testUserId = new ObjectId("687000000000000000000001");

  const savedLocationData = [
    {
      userId: testUserId,
      label: "Home",
      address: "120 Flatbush Avenue, Brooklyn, NY",
      latitude: 40.6845,
      longitude: -73.9776,
      tags: ["Home"],
    },
    {
      userId: testUserId,
      label: "Work",
      address: "350 Fifth Avenue, Manhattan, NY",
      latitude: 40.7484,
      longitude: -73.9857,
      tags: ["Work"],
    },
    {
      userId: testUserId,
      label: "School",
      address: "200 Queens Plaza, Queens, NY",
      latitude: 40.7506,
      longitude: -73.9402,
      tags: ["School"],
    },
    {
      userId: testUserId,
      label: "Family",
      address: "700 Grand Concourse, Bronx, NY",
      latitude: 40.8216,
      longitude: -73.9255,
      tags: ["Family"],
    },
    {
      userId: testUserId,
      label: "Gym",
      address: "120 Bay Street, Staten Island, NY",
      latitude: 40.6369,
      longitude: -74.076,
      tags: ["Gym"],
    },
  ];

  await savedLocationsCollection.insertMany(savedLocationData);
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
    dateOccurred: report.cmplnt_fr_dt,
  }));

  await officialReportsCollection.insertMany(formattedReports);
};

const main = async () => {
  const db = await dbConnection();
  await db.dropDatabase();

  await seedUserReports();
  await seedSavedLocations();
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
