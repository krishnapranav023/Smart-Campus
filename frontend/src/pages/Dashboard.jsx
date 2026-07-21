import React from 'react';
import AdminDashboardView from '../components/dashboard/AdminDashboardView';
import TeacherDashboardView from '../components/dashboard/TeacherDashboardView';
import StudentDashboardView from '../components/dashboard/StudentDashboardView';

const Dashboard = () => {
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch (err) {
    console.error('Error parsing dashboard user:', err);
  }

  if (user?.role === 'ADMIN') {
    return <AdminDashboardView />;
  } else if (user?.role === 'ORGANIZER') {
    return <TeacherDashboardView />;
  } else {
    return <StudentDashboardView />;
  }
};

export default Dashboard;