const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const vendorPath = path.resolve(__dirname, "www/assets/js/vendor.js");
const hashFile = path.resolve(__dirname, ".vendor.hash");

// Tính MD5 hash của file
function getFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("md5").update(buffer).digest("hex");
  return hash;
}

if (!fs.existsSync(vendorPath)) {
  console.error("⚠️ Không tìm thấy vendor.js sau khi build!");
  process.exit(1);
}

const currentHash = getFileHash(vendorPath);

// Nếu chưa có file hash → tạo mới
if (!fs.existsSync(hashFile)) {
  fs.writeFileSync(hashFile, currentHash, "utf8");
  console.log("✅ Tạo file hash mới cho vendor.js:", currentHash);
} else {
  const oldHash = fs.readFileSync(hashFile, "utf8");
  if (oldHash === currentHash) {
    console.log("👌 vendor.js không đổi, không cần upload lại.");
  } else {
    console.log("⚡ vendor.js đã thay đổi, cần upload lại.");
    fs.writeFileSync(hashFile, currentHash, "utf8");
  }
}
