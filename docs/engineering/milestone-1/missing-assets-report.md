# Missing Assets Report (Milestone 1)

This report details the explicit gaps in the current platform data and architecture, categorizing missing infrastructure, missing content, and planned (deferred) modules.

## 1. Missing Infrastructure (Coding Platform)
The coding platform is structurally deficient. The following core assets are missing and must be architected in Milestone 2:

- [x] **`questions` Table**: Exists, but is empty (0 rows).
- [x] **`test_cases` Table**: Exists, but is empty (0 rows).
- [x] **`submissions` Table**: Exists, but is empty (0 rows).
- [x] **`languages` Table**: Completely missing from schema.
- [x] **`templates` Table**: Completely missing from schema.
- [x] **`editorials` Table**: Completely missing from schema.
- [x] **`constraints` Table**: Completely missing from schema.

*Note: The `problems` table contains exactly 1,000 legacy rows from an April 2026 seed, which represents only ~1% of the expected 100k+ dataset. The 100,000 hidden/visible test cases are entirely absent.*

## 2. Missing Content Datasets
The following domains are currently empty and require massive data generation or external ingestion via the Milestone 2 Import Engine.

- [x] **Verbal Ability Questions**
- [x] **SQL Questions**
- [x] **MongoDB Questions**
- [x] **PostgreSQL Questions**
- [x] **AI/ML Questions**
- [x] **Java / Python / C++ Syntax Modules**

## 3. Incomplete Schema Relationships
While the V3 core (`Domain -> Module -> Lesson -> Concept -> Question`) is strictly enforced, the following legacy tables lack absolute V3 parent mappings:
- **`sd_questions`**: 350 rows lack a proper migration into `platform_questions`.

## 4. Deferred Assets (Planned for Future Milestones)
- **Contest Live Rankings / Virtual Leaderboards**: Deferred to Milestone 5.
- **AI Tutor Context Models**: Deferred to Milestone 5.
- **Student Analytics Heatmaps**: Deferred to Milestone 4.

*Document finalized prior to kicking off Milestone 2.*
