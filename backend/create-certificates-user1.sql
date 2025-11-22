-- Script untuk menambahkan sertifikat untuk user1@test.com
-- Pastikan user1@test.com sudah terdaftar di event dan hadir

-- Pertama, pastikan user1@test.com memiliki registrasi yang sudah hadir
UPDATE event_registrations 
SET has_attended = true 
WHERE id IN (
  SELECT id FROM event_registrations
  WHERE participant_id = (SELECT id FROM users WHERE email = 'user1@test.com')
  LIMIT 3
);

-- Buat sertifikat untuk registrasi user1@test.com yang sudah hadir
INSERT INTO certificates (id, registration_id, certificate_number, certificate_url, verification_hash, issued_at, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  r.id as registration_id,
  CONCAT('CERT-', EXTRACT(YEAR FROM NOW()), '-', LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')) as certificate_number,
  CONCAT('/uploads/certificates/cert-', r.id, '-', FLOOR(RANDOM() * 10000), '.pdf') as certificate_url,
  MD5(CONCAT(r.id, NOW()::TEXT)) as verification_hash,
  NOW() as issued_at,
  NOW() as created_at,
  NOW() as updated_at
FROM event_registrations r
INNER JOIN users u ON r.participant_id = u.id
WHERE u.email = 'user1@test.com'
  AND r.has_attended = true
  AND NOT EXISTS (
    SELECT 1 FROM certificates c WHERE c.registration_id = r.id
  )
LIMIT 3;
