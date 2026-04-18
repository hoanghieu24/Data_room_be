const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzdlidby9a',
    api_key: process.env.CLOUDINARY_API_KEY || '753687823468495',
    api_secret: process.env.CLOUDINARY_API_SECRET || '_7CXnsC79ZFpFDmlOxkzwIJsMyE',
    secure: true
});

console.log('🔧 Cloudinary configured with cloud_name:', cloudinary.config().cloud_name);

// Test connection
cloudinary.api.ping()
    .then(result => console.log('✅ Cloudinary connected successfully'))
    .catch(error => console.error('❌ Cloudinary connection failed:', error.message));

module.exports = cloudinary;