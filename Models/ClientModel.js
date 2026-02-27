import mongoose from "mongoose";

/* =========================
   DOCUMENT SCHEMA (IMAGES)
========================= */
const documentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    enum: [
      "AadhaarFront",
      "AadhaarBack",
      "PANCard",
      "Passport",
      "PassportFront",
      "PassportBack",
      "DrivingLicenseFront",
      "DrivingLicenseBack",
      "VoterCardFront",
      "VoterCardBack",
      "MarksheetFront",
      "MarksheetBack",
      "CVPage1",
      "CVPage2",
      "CVPage3",
      "CVPage4",
      "Other",
    ],
    required: true,
  },
  imageUrl: { type: String, required: true },
  capturedAt: { type: Date, default: Date.now },
});

/* =========================
   BIOMETRIC (OPTIONAL)
========================= */
const biometricSchema = new mongoose.Schema({
  fingerType: {
    type: String,
    enum: [
      "RightThumb",
      "RightIndex",
      "RightMiddle",
      "RightRing",
      "RightLittle",
      "LeftThumb",
      "LeftIndex",
      "LeftMiddle",
      "LeftRing",
      "LeftLittle",
    ],
  },
  fingerprintUrl: String,
  quality: { type: Number, default: 0 },
  capturedAt: { type: Date, default: Date.now },
});

/* =========================
   MAIN CLIENT SCHEMA
========================= */
const clientSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    clientName: { type: String, required: true },
    surname: { type: String, required: true },
    contact: { type: String, required: true, unique: true },
    email: { type: String },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    dob: { type: Date, required: true },
    age: { type: Number, required: true },
    nationality: { type: String, required: true },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Separated", "Divorced", "Widowed"],
      required: true,
    },

    education: String,
    occupation: String,
    address: String,

    familyMembersCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },

    // new fields for visa application
    preWorkExperience: { type: String, default: "" },
    consularName: { type: String, default: "" },
    country: { type: String, default: "" },
    appliedFor: { type: String, default: "" },

    /* GOVERNMENT SERVANT INFORMATION */
    hasGovtServant: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    // ✅ FIX: "" added to allow empty value when hasGovtServant = "No"
    govtServantRelation: {
      type: String,
      enum: [
        "",
        "Father",
        "Mother",
        "Spouse",
        "Brother",
        "Sister",
        "Son",
        "Daughter",
        "Uncle",
        "Aunt",
        "Grandfather",
        "Grandmother",
        "Other",
      ],
      default: "",
    },

    govtServantName: { type: String, default: "" },

    // ✅ FIX: "" added to allow empty value when hasGovtServant = "No"
    govtServantWorkType: {
      type: String,
      enum: [
        "",
        "Central Government",
        "State Government",
        "PSU (Public Sector Undertaking)",
        "Indian Army",
        "Indian Navy",
        "Indian Air Force",
        "Police Department",
        "Railway",
        "Banking Sector",
        "Teaching (Government School/College)",
        "Medical (Government Hospital)",
        "Judiciary",
        "Municipal Corporation",
        "Other Government Department",
      ],
      default: "",
    },

    govtServantDesignation: { type: String, default: "" },

    /* PARENTS */
    fatherName: { type: String, required: true },
    fatherSurname: { type: String, required: true },
    fatherPhone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
    },
    fatherEmail: String,

    motherName: { type: String, required: true },
    motherSurname: { type: String, required: true },
    motherPhone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
    },
    motherEmail: String,

    /* SPOUSE (IF MARRIED) */
    spouseName: String,
    spouseSurname: String,
    spousePhone: String,
    spouseEmail: String,

    /* DOCUMENT NUMBERS */
    aadhaarCardNo: {
      type: String,
      required: true,
      match: [/^\d{12}$/, "Invalid Aadhaar number"],
    },

    panCardNo: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number"],
    },

    passportNo: {
      type: String,
      uppercase: true,
    },

    drivingLicenseNo: String,
    voterCardNo: String,

    /* DOCUMENT IMAGES - ALL OPTIONAL */
    documents: { type: [documentSchema], default: [] },

    /* LIVE PHOTO - REQUIRED */
    photo: { type: String, required: true },
    photoCapturedAt: { type: Date, default: Date.now },

    /* BIOMETRIC (FUTURE) */
    biometricData: { type: [biometricSchema], default: [] },

    /* STATUS */
    registrationStatus: {
      type: String,
      enum: ["Pending", "InProgress", "Completed", "Verified", "Rejected"],
      default: "Pending",
    },

    completedSteps: {
      clientInfo: { type: Boolean, default: false },
      documents: { type: Boolean, default: false },
      livePhoto: { type: Boolean, default: false },
      biometric: { type: Boolean, default: false },
    },

    remarks: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/* =========================
   INDEXES FOR SEARCH
========================= */
clientSchema.index({
  clientName: "text",
  surname: "text",
  contact: "text",
  email: "text",
});

/* =========================
   PRE SAVE LOGIC
========================= */
clientSchema.pre("save", function () {
  this.completedSteps.clientInfo = !!(
    this.clientName &&
    this.surname &&
    this.contact
  );

  this.completedSteps.livePhoto = !!this.photo;
  this.completedSteps.documents = this.documents.length > 0;

  if (this.biometricData.length > 0) {
    this.completedSteps.biometric = true;
  }

  // ✅ Fixed: second condition checks documents too so InProgress actually works
  if (this.completedSteps.clientInfo && this.completedSteps.livePhoto) {
    this.registrationStatus = "InProgress";
  }

  if (
    this.completedSteps.clientInfo &&
    this.completedSteps.livePhoto &&
    this.completedSteps.documents
  ) {
    this.registrationStatus = "Completed";
  }
});

export default mongoose.model("Client", clientSchema);