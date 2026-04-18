require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Cấu hình trực tiếp để test
cloudinary.config({
    cloud_name: 'dzdlidby9a',
    api_key: '753687823468495',
    api_secret: '_7CXnsC79ZFpFDmlOxkzwIJsMyE'
});

console.log('Testing Cloudinary connection...');
console.log('Cloud Name:', cloudinary.config().cloud_name);

async function testConnection() {
    try {
        // Test ping
        const pingResult = await cloudinary.api.ping();
        console.log('✅ Ping successful!');
        
        // Test upload with a small image
        const uploadResult = await cloudinary.uploader.upload(
            'https://picsum.photos/200/300', // Random test image
            {
                folder: 'test',
                public_id: 'test-' + Date.now()
            }
        );
        console.log('✅ Upload successful!');
        console.log('URL:', uploadResult.secure_url);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Status:', error.http_code);
    }
}

testConnection();