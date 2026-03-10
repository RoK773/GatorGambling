//checks for valid input and inserts new user into MongoDB
import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_DB || 'User_Data';
const collectionName = process.env.MONGODB_COLLECTION || 'Users';

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
};

let clientPromise;

if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

function calculateAgeFromDob(dobValue) {
    if (!dobValue) {
        return null;
    }

    const [year, month, day] = String(dobValue).split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    const today = new Date();
    let age = today.getFullYear() - year;
    const hasHadBirthday =
        today.getMonth() + 1 > month ||
        (today.getMonth() + 1 === month && today.getDate() >= day);

    if (!hasHadBirthday) {
        age -= 1;
    }

    if (age < 0 || age > 130) {
        return null;
    }

    return age;
}

function isValidEmail(emailValue) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
}

function isValidLocation(locationValue) {
    return /^[^,]+,\s*[^,]+$/.test(locationValue);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password, email, dob, location } = req.body || {};
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '').trim();
    const normalizedEmail = String(email || '').trim();
    const normalizedDob = String(dob || '').trim();
    const normalizedLocation = String(location || '').trim();

    if (!normalizedUsername) {
        return res.status(400).json({ error: 'Invalid username: this field is required.' });
    }

    if (!normalizedPassword) {
        return res.status(400).json({ error: 'Invalid password: this field is required.' });
    }

    if (!normalizedEmail) {
        return res.status(400).json({ error: 'Invalid email: this field is required.' });
    }

    if (!normalizedDob) {
        return res.status(400).json({ error: 'Invalid date of birth: this field is required.' });
    }

    if (!normalizedLocation) {
        return res.status(400).json({ error: 'Invalid location: this field is required.' });
    }

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email: use format name@domain.domain.' });
    }

    if (!isValidLocation(normalizedLocation)) {
        return res.status(400).json({ error: 'Invalid location: use Province, Country format.' });
    }

    const age = calculateAgeFromDob(normalizedDob);

    if (age === null) {
        return res.status(400).json({ error: 'Invalid date of birth: enter a valid date.' });
    }

    if (age < 21) {
        return res.status(400).json({ error: 'Invalid date of birth: you must be at least 21 years old.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const result = await users.insertOne({
            username: normalizedUsername,
            age,
            email: normalizedEmail,
            password: normalizedPassword,
            dob: normalizedDob,
            location: normalizedLocation,
            createdAt: new Date(),
        });

        return res.status(201).json({
            message: 'User inserted successfully',
            insertedId: result.insertedId,
        });
    } catch (error) {
        console.error('Signup insert failed:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
}
