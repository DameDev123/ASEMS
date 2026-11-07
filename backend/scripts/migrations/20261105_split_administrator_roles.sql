-- AAPEMS: Separate administrator roles

ALTER TABLE users
MODIFY COLUMN role ENUM(
  'admin',
  'super_admin',
  'academic_admin',
  'administrative_admin',
  'student',
  'teacher',
  'department_head',
  'dean',
  'committee',
  'management',
  'academic_vp',
  'archives',
  'concerned_office'
) NOT NULL DEFAULT 'student';

-- Upgrade existing administrators
UPDATE users
SET role = 'super_admin'
WHERE role = 'admin';

-- Index employee classification
ALTER TABLE employees
ADD INDEX idx_employees_employee_type (employee_type);