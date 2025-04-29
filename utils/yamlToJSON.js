const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

try {
    // Read the YAML file
    const inputFile = path.join(__dirname, '..', 'spec3.yml');
    const outputFile = path.join(__dirname, '..', 'spec3.json');
    
    // Read and parse the YAML content
    const yamlContent = fs.readFileSync(inputFile, 'utf8');
    const jsonContent = yaml.load(yamlContent);
    
    // Convert to JSON and write to file
    fs.writeFileSync(outputFile, JSON.stringify(jsonContent, null, 2));
    
    console.log('Successfully converted spec3.yml to spec3.json');
} catch (error) {
    console.error('Error converting YAML to JSON:', error);
    process.exit(1);
}