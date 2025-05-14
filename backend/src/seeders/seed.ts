// src/seeders/seed.ts
import { Course, TryoutSection } from '../models';
import sequelize from '../config/database';

// Course data
const coursesData = {
  "RECORDS": [
    {
      "id": "115743e4-b42b-4ffe-8418-689a6b3777c3",
      "code": "ISMS-S01_API_SECURITY",
      "title": "API Security",
      "description": null,
      "order": 1,
      "data": "{\"icon\": \"🔐\", \"type\": \"LMS\", \"telegram\": {\"shortId\": 1}}",
      "tag": "phincon",
      "active": 1,
      "createdAt": "1/5/2025 11:32:55",
      "updatedAt": "1/5/2025 11:32:55"
    },
    {
      "id": "3e0c2ee4-31aa-44c8-b555-e4a5df02ff84",
      "code": "ISMS-S21_SECURE_SYSTEM_DEVELOPMENT_LIFECYCLE",
      "title": "Secure System Development Lifecycle",
      "description": null,
      "order": 1,
      "data": "{\"icon\": \"🔐\", \"type\": \"LMS\", \"telegram\": {\"shortId\": 2}}",
      "tag": "phincon",
      "active": 1,
      "createdAt": "1/5/2025 11:32:55",
      "updatedAt": "1/5/2025 11:32:55"
    },
    {
      "id": "e1a15a9c-829a-4d45-8040-2d2e3871e059",
      "code": "ISMS-S30_BUILD_SECURITY_SYSTEM_STANDARD",
      "title": "Security System Standard",
      "description": null,
      "order": 1,
      "data": "{\"icon\": \"🔐\", \"type\": \"LMS\", \"telegram\": {\"shortId\": 3}}",
      "tag": "phincon",
      "active": 1,
      "createdAt": "1/5/2025 11:32:55",
      "updatedAt": "1/5/2025 11:32:55"
    }
  ]
};

// TryoutSection data
const tryoutSectionsData = {
  "RECORDS": [
    {
      "id": "3c91e9f7-f803-426c-8966-4fd4dd812286",
      "code": "TRYOUT_EMOTIONAL_QUOTIENT",
      "description": "Emotional Quotient (EQ) adalah kemampuan seseorang dalam memahami, mengelola, dan mengekspresikan emosinya secara positif serta berempati terhadap orang lain.\nPelatihan ini dirancang untuk meningkatkan kesadaran diri, mengelola emosi secara sehat, membangun hubungan interpersonal yang kuat, dan meningkatkan kemampuan beradaptasi di lingkungan kerja.",
      "title": "Tryout Emotional Quotient",
      "order": 1,
      "data": "{\"icon\": \"📝\", \"type\": \"multiple-choice\", \"duration\": 3600000, \"telegram\": {\"shortId\": 4, \"instruction\": \"Please follow the current instruction:\"}, \"instruction\": \"<div style=\\\"max-width: 700px; margin: 40px auto; background: #121212; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);\\\">\\n    <h2 style=\\\"color: white; text-align: center; border-bottom: 3px solid black; padding-bottom: 10px;\\\">Panduan Pengerjaan Soal Cyber Security</h2>\\n\\n    <h3 style=\\\"color: white; margin-top: 20px;\\\"><strong>Durasi:</strong> 1 jam</h3>\\n    <h3 style=\\\"color: white;\\\"><strong>Jumlah Soal:</strong> 20 (Pilihan Ganda)</h3>\\n\\n    <h3 style=\\\"color: white; border-bottom: 2px solid #ddd; padding-bottom: 5px;\\\">Petunjuk Pengerjaan:</h3>\\n    <ol style=\\\"color: white; font-size: 16px; line-height: 1.6; padding-left: 20px; list-style-type: disc;\\\">\\n        <li>Bacalah setiap soal dengan cermat sebelum menjawab.</li>\\n        <li>Pilihlah jawaban yang paling tepat dari <strong>a, b, c, d, atau e</strong>.</li>\\n        <li>Tidak diperkenankan menggunakan catatan atau alat bantu lainnya.</li>\\n        <li>Jawaban yang benar akan diberikan <strong>1 poin</strong>, tidak ada pengurangan poin untuk jawaban salah.</li>\\n        <li>Jika waktu habis, jawaban yang sudah terisi akan dikumpulkan secara otomatis.</li>\\n    </ol>\\n</div>\"}",
      "tag": "phincon",
      "active": 1,
      "createdAt": "1/5/2025 11:32:54",
      "updatedAt": "1/5/2025 11:32:54"
    },
    {
      "id": "8b6174db-3bb3-41b3-aeac-5e17479cad2a",
      "code": "ISMS-30_CSP_BEGINNER",
      "description": "Content Security Policy (Beginner) - Phincon",
      "title": "Content Security Policy (Beginner) - Phincon",
      "order": 1,
      "data": "{\"icon\": \"📝\", \"type\": \"multiple-choice\", \"duration\": 3600000, \"telegram\": {\"shortId\": 2, \"instruction\": \"Please follow the current instruction:\"}, \"instruction\": \"<div style=\\\"max-width: 700px; margin: 40px auto; background: #121212; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);\\\">\\n    <h2 style=\\\"color: white; text-align: center; border-bottom: 3px solid black; padding-bottom: 10px;\\\">Panduan Pengerjaan Soal Cyber Security</h2>\\n\\n    <h3 style=\\\"color: white; margin-top: 20px;\\\"><strong>Durasi:</strong> 1 jam</h3>\\n    <h3 style=\\\"color: white;\\\"><strong>Jumlah Soal:</strong> 20 (Pilihan Ganda)</h3>\\n\\n    <h3 style=\\\"color: white; border-bottom: 2px solid #ddd; padding-bottom: 5px;\\\">Petunjuk Pengerjaan:</h3>\\n    <ol style=\\\"color: white; font-size: 16px; line-height: 1.6; padding-left: 20px; list-style-type: disc;\\\">\\n        <li>Bacalah setiap soal dengan cermat sebelum menjawab.</li>\\n        <li>Pilihlah jawaban yang paling tepat dari <strong>a, b, c, d, atau e</strong>.</li>\\n        <li>Tidak diperkenankan menggunakan catatan atau alat bantu lainnya.</li>\\n        <li>Jawaban yang benar akan diberikan <strong>1 poin</strong>, tidak ada pengurangan poin untuk jawaban salah.</li>\\n        <li>Jika waktu habis, jawaban yang sudah terisi akan dikumpulkan secara otomatis.</li>\\n    </ol>\\n</div>\"}",
      "tag": "phincon",
      "active": 1,
      "createdAt": "1/5/2025 11:32:54",
      "updatedAt": "1/5/2025 11:32:54"
    },
    // ... other records...
  ]
};

/**
 * Seeds the database with initial data
 * This function can be called from a script or API endpoint
 */
export async function seedDatabase() {
  try {
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      console.log('Starting seed process...');
      
      // Seed Courses
      console.log('Seeding Courses...');
      for (const courseData of coursesData.RECORDS) {
        const createDate = new Date(courseData.createdAt);
        const updateDate = new Date(courseData.updatedAt);
        
        await Course.create({
          id: courseData.id,
          code: courseData.code,
          title: courseData.title,
          description: courseData.description,
          order: courseData.order,
          data: JSON.parse(courseData.data),
          tag: courseData.tag,
          isActive: courseData.active === 1,
          startDate: createDate,
          endDate: updateDate,
          createdAt: createDate,
          updatedAt: updateDate
        }, { transaction });
      }
      
      // Seed TryoutSections
      console.log('Seeding Tryout Sections...');
      for (const sectionData of tryoutSectionsData.RECORDS) {
        const createDate = new Date(sectionData.createdAt);
        const updateDate = new Date(sectionData.updatedAt);
        
        await TryoutSection.create({
          id: sectionData.id,
          code: sectionData.code,
          title: sectionData.title,
          description: sectionData.description,
          order: sectionData.order,
          data: JSON.parse(sectionData.data),
          tag: sectionData.tag,
          isActive: sectionData.active === 1,
          createdAt: createDate,
          updatedAt: updateDate
        }, { transaction });
      }
      
      // Commit the transaction
      await transaction.commit();
      console.log('Database seeded successfully!');
      
      return { success: true, message: 'Database seeded successfully!' };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      console.error('Error seeding database:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error starting transaction:', error);
    throw error;
  }
}

/**
 * Creates a seeder controller to handle seeding via API
 */
export const seederController = {
  async seedAll(req: any, res: any) {
    try {
      const result = await seedDatabase();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in seed controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to seed database',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  async seedCourses(req: any, res: any) {
    try {
      const transaction = await sequelize.transaction();
      
      try {
        // Delete existing courses first if requested
        if (req.query.clean === 'true') {
          await Course.destroy({ 
            where: {}, 
            truncate: true,
            cascade: true,
            transaction 
          });
        }
        
        // Seed Courses
        for (const courseData of coursesData.RECORDS) {
          const createDate = new Date(courseData.createdAt);
          const updateDate = new Date(courseData.updatedAt);
          
          await Course.create({
            id: courseData.id,
            code: courseData.code,
            title: courseData.title,
            description: courseData.description,
            order: courseData.order,
            data: JSON.parse(courseData.data),
            tag: courseData.tag,
            isActive: courseData.active === 1,
            startDate: createDate,
            endDate: updateDate,
            createdAt: createDate,
            updatedAt: updateDate
          }, { transaction });
        }
        
        await transaction.commit();
        
        return res.status(200).json({
          success: true,
          message: 'Courses seeded successfully!',
          count: coursesData.RECORDS.length
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error seeding courses:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to seed courses',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  async seedTryoutSections(req: any, res: any) {
    try {
      const transaction = await sequelize.transaction();
      
      try {
        // Delete existing tryout sections first if requested
        if (req.query.clean === 'true') {
          await TryoutSection.destroy({ 
            where: {}, 
            truncate: true,
            cascade: true,
            transaction 
          });
        }
        
        // Seed TryoutSections
        for (const sectionData of tryoutSectionsData.RECORDS) {
          const createDate = new Date(sectionData.createdAt);
          const updateDate = new Date(sectionData.updatedAt);
          
          await TryoutSection.create({
            id: sectionData.id,
            code: sectionData.code,
            title: sectionData.title,
            description: sectionData.description,
            order: sectionData.order,
            data: JSON.parse(sectionData.data),
            tag: sectionData.tag,
            isActive: sectionData.active === 1,
            createdAt: createDate,
            updatedAt: updateDate
          }, { transaction });
        }
        
        await transaction.commit();
        
        return res.status(200).json({
          success: true,
          message: 'Tryout sections seeded successfully!',
          count: tryoutSectionsData.RECORDS.length
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error seeding tryout sections:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to seed tryout sections',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
if (require.main === module) {
    seedDatabase()
      .then(() => {
        console.log('Seeding completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
      });
  }
  