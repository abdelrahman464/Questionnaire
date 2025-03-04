const XLSX = require("xlsx");
const User = require("../models/userModel");
const mongoose = require("mongoose");

const generateNumber = (char) => {
  const currentYear = new Date().getFullYear();
  const randomNumbers = Math.floor(Math.random() * 1000000000); // Generate 8 random numbers
  const result = `${char}${currentYear}${randomNumbers
    .toString()
    .padStart(8, "0")}`;
  return result;
};

exports.processExcel = async (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const usersData = [];
  const existingUsers = [];

  let code;
  let allowed_keys;
  for (const row of sheetData) {
    // Check for account existence
    const isExist = await User.findOne({ email: row.email });
    console.log(typeof generateNumber);
    code = generateNumber(row.email.charAt(0).toUpperCase());
    allowed_keys = row.allowed_keys?.split(",") || [];
    allowed_keys = allowed_keys.map((key) => new mongoose.Types.ObjectId(key));

    if (!isExist) {
      usersData.push({
        name: row.name,
        email: row.email,
        phone: row.phone,
        code: code,
        allowed_keys: allowed_keys,
        role: row.role?.toLowerCase() || "user",
        organization: row.organization?.toLowerCase() || null,
      });
    } else {
      existingUsers.push({
        name: row.name,
        email: row.email,
        phone: row.phone,
      });
    }
  }

  return { usersData, existingUsers };
};
