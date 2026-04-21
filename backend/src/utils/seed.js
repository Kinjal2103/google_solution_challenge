require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const ZONES = [
    'Mumbai', 'Pune', 'Nagpur',
    'North Delhi', 'South Delhi', 'Central Delhi',
    'Bengaluru', 'Mysuru', 'Mangaluru',
    'Chennai', 'Coimbatore', 'Madurai',
    'Ahmedabad', 'Surat', 'Vadodara',
    'Kolkata', 'Darjeeling', 'Howrah',
    'Lucknow', 'Kanpur', 'Varanasi'
];
const CATEGORIES = ['food', 'water', 'shelter', 'medical', 'sanitation', 'livelihood'];
const SKILLS = ['medical', 'driving', 'translation', 'logistics', 'cooking', 'heavy_lifting'];

// Helper to get random array items
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomSkills = () => {
    const shuffled = SKILLS.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, getRandomInt(1, 3)); // Returns 1 to 3 random skills
};

async function seedDatabase() {
    console.log('🌱 Starting Database Seeding...');

    try {
        // 1. CREATE AN ORGANIZATION
        console.log('Creating Organization...');
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert([{
                name: 'Relief Network India',
                contact_email: 'hello@reliefnetwork.in',
                type: 'ngo',
                verified: true
            }])
            .select().single();

        if (orgError) throw orgError;
        const orgId = org.id;

        // 2. CREATE 50 VOLUNTEERS
        console.log('Generating 50 Volunteers...');
        const volunteersToInsert = [];
        for (let i = 1; i <= 50; i++) {
            volunteersToInsert.push({
                organization_id: orgId,
                full_name: `Volunteer ${i}`,
                email: `volunteer${i}@example.com`,
                phone: `+9198765432${i.toString().padStart(2, '0')}`,
                zone: getRandom(ZONES),
                skills: getRandomSkills(),
                reliability_score: getRandomInt(60, 100)
            });
        }

        const { error: volError } = await supabase.from('volunteers').insert(volunteersToInsert);
        if (volError) throw volError;

        // 3. CREATE 200 OPEN NEEDS
        console.log('Generating 200 Needs...');
        const needsToInsert = [];
        for (let i = 1; i <= 200; i++) {
            const category = getRandom(CATEGORIES);
            const severity = getRandomInt(1, 5);
            const vulnerability_index = getRandomInt(1, 5);
            const people_affected = getRandomInt(1, 10);

            // Mirroring your backend math so the dashboard looks accurate
            let score = (severity * 15) + (vulnerability_index * 10) + (people_affected * 2);
            if (category === 'medical') score += 20;
            if (category === 'food' || category === 'water') score += 10;
            const urgency_score = Math.min(100, score);

            needsToInsert.push({
                organization_id: orgId,
                title: `Urgent ${category} requirement`,
                description: `Generated synthetic data for testing. Requires immediate attention.`,
                category: category,
                zone: getRandom(ZONES),
                severity: severity,
                vulnerability_index: vulnerability_index,
                people_affected: people_affected,
                urgency_score: urgency_score,
                volunteer_count_needed: getRandomInt(1, 3),
                required_skills: [getRandom(SKILLS)] // Requesting at least 1 random skill
            });
        }

        // Insert in batches of 100 to avoid overloading the API
        const { error: needError1 } = await supabase.from('needs').insert(needsToInsert.slice(0, 100));
        if (needError1) throw needError1;

        const { error: needError2 } = await supabase.from('needs').insert(needsToInsert.slice(100, 200));
        if (needError2) throw needError2;

        console.log('✅ Seeding Complete! Inserted 1 Org, 50 Volunteers, and 200 Needs.');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedDatabase();