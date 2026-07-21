import jwt from 'jsonwebtoken';

export const generateToken = (id, role, institutionId) => {
  return jwt.sign({ id, role, institutionId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};
