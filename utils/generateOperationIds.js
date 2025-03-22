const fs = require("fs");

// Read the OpenAPI spec file
const spec = JSON.parse(fs.readFileSync("spec3.json", "utf8"));

// Helper function to convert path to operationId
function pathToOperationId(path) {
  // Remove leading slash and convert to camelCase
  return path
    .slice(1) // Remove leading slash
    .split(/[._]/) // Split by both dots and underscores
    .map((part, index) => {
      // Handle empty parts
      if (!part) return "";

      if (index === 0) {
        // Keep first part lowercase
        return part.toLowerCase();
      }
      // Capitalize first letter of subsequent parts
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

// Process each path
for (const [path, methods] of Object.entries(spec.paths)) {
  // Process each HTTP method (post, get, etc)
  for (const [method, operation] of Object.entries(methods)) {
    // Add operationId if it doesn"t exist
    operation.operationId = pathToOperationId(path);
  }
}

// Write the updated spec back to file
fs.writeFileSync(
  "spec3.json",
  JSON.stringify(spec, null, 2),
  "utf8"
);

console.log("Added operationIds to all endpoints");