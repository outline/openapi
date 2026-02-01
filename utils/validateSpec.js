const SwaggerParser = require('@apidevtools/swagger-parser');
const path = require('path');

async function validateSpec() {
    const specFile = path.join(__dirname, '..', 'spec3.yml');

    try {
        // Validate and parse the OpenAPI spec
        const api = await SwaggerParser.validate(specFile);
        console.log(`✓ OpenAPI spec is valid (${api.info.title} v${api.info.version})`);
        return true;
    } catch (error) {
        console.error('✗ OpenAPI spec validation failed:');
        console.error(error.message);
        return false;
    }
}

validateSpec().then(isValid => {
    process.exit(isValid ? 0 : 1);
});
