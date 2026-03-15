-- Add unique constraints for fields that should not duplicate within each resource scope.

-- Sections: unique name per subject (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_subject_name_unique_ci
  ON sections (subject_id, LOWER(name));

-- Lectures: unique title per section (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lectures_section_title_unique_ci
  ON lectures (section_id, LOWER(title));

-- Resources: unique label and URL per lecture
CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_lecture_label_unique_ci
  ON resources (lecture_id, LOWER(label));

CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_lecture_url_unique
  ON resources (lecture_id, url);

-- Profiles: make email uniqueness case-insensitive, and student_id uniqueness explicit for non-null values
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique_ci
  ON profiles (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_student_id_unique_nonnull
  ON profiles (student_id)
  WHERE student_id IS NOT NULL;
