const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

/**
 * Converts an API path to the expected operationId, preserving camelCase.
 *
 * @param {string} apiPath - the API path (e.g., "/fileOperations.info").
 * @returns {string} the expected operationId (e.g., "fileOperationsInfo").
 */
function pathToOperationId(apiPath) {
    // Remove leading slash
    const pathWithoutSlash = apiPath.slice(1);

    // Split by dot (e.g., "fileOperations.info" -> ["fileOperations", "info"])
    const parts = pathWithoutSlash.split('.');

    return parts
        .map((part, partIndex) => {
            // Split each part by underscore for snake_case handling
            // e.g., "add_user" -> ["add", "user"]
            const subParts = part.split('_');

            return subParts
                .map((subPart, subPartIndex) => {
                    if (partIndex === 0 && subPartIndex === 0) {
                        // Keep the first segment's case intact to preserve camelCase
                        // e.g., "fileOperations" stays "fileOperations"
                        return subPart;
                    }
                    // Capitalize first letter of subsequent parts
                    return subPart.charAt(0).toUpperCase() + subPart.slice(1);
                })
                .join('');
        })
        .join('');
}

try {
    const specFile = path.join(__dirname, '..', 'spec3.yml');

    // Read and parse the YAML content
    const yamlContent = fs.readFileSync(specFile, 'utf8');
    const spec = yaml.load(yamlContent);

    const issues = [];

    // Process each path
    for (const [apiPath, methods] of Object.entries(spec.paths || {})) {
        // Process each HTTP method (post, get, etc.)
        for (const [method, operation] of Object.entries(methods)) {
            // Skip non-operation properties like 'parameters'
            if (typeof operation !== 'object' || operation === null) {
                continue;
            }

            const expectedOperationId = pathToOperationId(apiPath);

            if (!operation.operationId) {
                issues.push({
                    type: 'missing',
                    path: apiPath,
                    method: method.toUpperCase(),
                    expected: expectedOperationId,
                });
            } else if (operation.operationId !== expectedOperationId) {
                issues.push({
                    type: 'mismatch',
                    path: apiPath,
                    method: method.toUpperCase(),
                    current: operation.operationId,
                    expected: expectedOperationId,
                });
            }
        }
    }

    if (issues.length > 0) {
        console.error('✗ Operation ID issues found:\n');

        for (const issue of issues) {
            if (issue.type === 'missing') {
                console.error(`  Missing operationId for ${issue.method} ${issue.path}`);
                console.error(`    Expected: ${issue.expected}\n`);
            } else {
                console.error(`  Incorrect operationId for ${issue.method} ${issue.path}`);
                console.error(`    Current:  ${issue.current}`);
                console.error(`    Expected: ${issue.expected}\n`);
            }
        }

        console.error(`Found ${issues.length} issue(s). Please update spec3.yml.`);
        process.exit(1);
    }

    console.log('✓ All operation IDs are valid');
} catch (error) {
    console.error('✗ Error validating operation IDs:', error.message);
    process.exit(1);
}
