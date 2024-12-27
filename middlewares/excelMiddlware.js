const XLSX = require("xlsx");

const User = require("../models/userModel");
const { generateNumber } = require("../services/userService");

exports.processExcel = async (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const usersData = [];
  const existingUsers = [];
  console.log(sheetData);
  for (const row of sheetData) {
    // Check for account existence
    let code;
    const isExist = await User.findOne({ email: row.email });
    code = generateNumber(row.email.charAt(0));
    if (!isExist) {
      usersData.push({
        name: row.name,
        email: row.email,
        phone: row.phone,
        code: code,
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
