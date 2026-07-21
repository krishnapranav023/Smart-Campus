import prisma from './prisma.js';

export const updateDemoUsers = async () => {
  try {
    const adminEmail = "krishnapranav2020@gmail.com";
    const studentEmail = "krishnapranav2024@gmail.com";
    const organizerEmail = "11229A023@kanchoiuniv.ac.in";

    // 1. Check and Update Admin
    const admin = await prisma.user.findFirst({
      where: { OR: [ { role: 'ADMIN' }, { email: 'admin@scsvmv.edu.in' } ] }
    });
    if (admin && admin.email !== adminEmail) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { email: adminEmail }
      });
      console.log(`✓ Synchronized Admin email address to ${adminEmail}`);
    }

    // 2. Check and Update Student (VIT Participant)
    const student = await prisma.user.findFirst({
      where: { OR: [ { name: 'VIT Participant' }, { email: 'participant@vit.ac.in' } ] }
    });
    if (student && student.email !== studentEmail) {
      await prisma.user.update({
        where: { id: student.id },
        data: { email: studentEmail }
      });
      console.log(`✓ Synchronized Student email address to ${studentEmail}`);
    }

    // 3. Check and Update Organizer (SCSVMV)
    // If SCSVMV Organizer exists with different email, or if SRM Organizer is used as the demo, update it
    const organizer = await prisma.user.findFirst({
      where: { 
        OR: [
          { name: 'SCSVMV Organizer' },
          { email: 'organizer@scsvmv.edu.in' },
          { email: 'organizer@srmist.edu.in' }
        ] 
      }
    });
    if (organizer && organizer.email !== organizerEmail) {
      const scsvmvInst = await prisma.institution.findFirst({
        where: { code: 'SCSVMV' }
      });
      await prisma.user.update({
        where: { id: organizer.id },
        data: { 
          email: organizerEmail,
          name: 'SCSVMV Organizer',
          ...(scsvmvInst && { institutionId: scsvmvInst.id })
        }
      });
      console.log(`✓ Synchronized SCSVMV Organizer email address to ${organizerEmail}`);
    }
  } catch (err) {
    console.error('⚠️ Startup sync hook failed:', err.message);
  }
};
