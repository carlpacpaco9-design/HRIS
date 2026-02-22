-- 1. Create a Test SPMS Cycle
INSERT INTO spms_cycles (title, is_active)
VALUES 
    ('Jan - June 2026', true);

-- 2. Verify it was created
SELECT * FROM spms_cycles;
