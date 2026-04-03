# NutriMind EDU — Gameplay Mechanics

**Generated**: 2026-04-04

---

## 1. Student Game Flow

### Login & Mode Selection

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Game Load   │────▶│  Login Screen        │────▶│  Mode Selection │
│  (Splash)    │     │  (Student ID + PIN)  │     │  Online/Offline │
└──────────────┘     └──────────────────────┘     └───────┬─────────┘
                                                          │
                                      ┌───────────────────┼──────────────────┐
                                      ▼                                      ▼
                           ┌────────────────────┐              ┌──────────────────────┐
                           │  ONLINE MODE       │              │  OFFLINE MODE         │
                           │  (Full features)   │              │  (Practice / Training │
                           │  Server-validated   │              │   Grounds)            │
                           └────────┬───────────┘              └──────────┬───────────┘
                                    ▼                                      ▼
                           ┌────────────────────┐              ┌──────────────────────┐
                           │  Hub Selection     │              │  Cached Content       │
                           │  (English, Science,│              │  Practice challenges  │
                           │   PE+Health)       │              │  Local progress only  │
                           └────────┬───────────┘              └──────────────────────┘
                                    ▼
                           ┌────────────────────┐
                           │  Enter Server Code │
                           │  (Teacher-provided)│
                           └────────┬───────────┘
                                    ▼
                           ┌────────────────────┐
                           │  COMMAND FORTRESS   │
                           │  (World Selection)  │
                           └────────────────────┘
```

### Step-by-Step Flow

1. **Game loads** → splash screen with NutriMind EDU branding
2. **Login** → Student enters their Student ID + 4-digit PIN
3. **Internet check** → App detects connectivity
   - **No internet** → Online mode grayed out; only Offline mode accessible
   - **Internet present** → Both modes available
4. **Mode selection** → Student chooses Online or Offline
5. **If Online:**
   - Student sees 3 hub doors (English, Science, PE+Health)
   - Student selects a hub → enters the 6-character server code from their teacher
   - After joining → enters **Command Fortress** (main hub showing world progress)
   - Selects a world → enters zone → selects topic → plays challenges
6. **If Offline:**
   - Student enters **Training Grounds** using cached content pack
   - Same challenge types, same worlds, but progress is local-only
   - Acts as practice/preparation for online mode in class

### Hub → World Mapping

Each hub corresponds to one world:

| Hub Subject | World | Boss(es) |
|------------|-------|----------|
| **English** | Literacy Island | Word Warden |
| **Science** | Science Frontier + Health City | Contaminus + Junklord |
| **PE + Health** | PE Arena | Idle Rex |

> Students join a hub by entering the server code their teacher provides. Each teacher creates their own hubs (max 1 per subject per grade level). Students see the same 3 hub categories but join a specific teacher's instance via code.

---

## 2. World Structure

### Content Authorship

> **Teachers create all challenge content.** The curriculum structure (worlds, zones, topics) is seeded and global — every teacher sees the same world/zone/topic framework. But the actual challenge questions within each topic are **authored by the teacher for their own hub**. Students in different hubs may see completely different questions for the same topic, depending on what their teacher has created.

### Hierarchy

```
World (Subject)
  └── Zone (Quarter)
        └── Topic (Weekly Focus)
              └── Challenges (Individual questions/tasks)
                    └── Boss Battle (End-of-zone mastery assessment)
```

### Zone Progression Rules

- Each world has **4 zones** (one per quarter)
- Each zone has **8 topics** (one per week)
- Topics 1-5 = New content
- Topic 6 = Review
- Topic 7 = Mastery challenge
- Topic 8 = **Quarterly Milestone** (mini-boss or zone completion assessment)
- Zones unlock **sequentially** — must complete Zone 1 to unlock Zone 2
- Within a zone, topics unlock sequentially (complete Week 1 quiz to unlock Week 2)
- **Boss Battle** unlocks when ≥80% of zone challenges completed with ≥70% accuracy

### Per-Grade Content

Every world has **two parallel content tracks**:
- **Grade 5 track** — aligned with MATATAG Grade 5 competencies
- **Grade 6 track** — aligned with MATATAG Grade 6 competencies

The server determines which track to serve based on the student's grade level (stored in their profile). A Grade 5 student in Literacy Island sees Grade 5 English content; a Grade 6 student sees Grade 6 English content.

---

## 3. World 1: Literacy Island (English)

### Overview

| Aspect | Detail |
|--------|--------|
| **Subject** | English |
| **Hub name** | English |
| **World boss** | Word Warden |
| **Zones** | 4 (one per quarter) |
| **Topics per zone** | 8 (weekly) |
| **Challenge types** | Spelling, vocabulary, reading comprehension, fluency |

### Grade 5 — Zone Breakdown

#### Zone 1: Forest of Words (Q1)
**Focus:** Advanced Spelling and Word Structure

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Root Words | Word-root matching, fill-in-the-blank, word building |
| 2 | Prefixes | Prefix identification, word meaning prediction, prefix-root assembly |
| 3 | Suffixes | Suffix matching, word transformation, meaning shifts |
| 4 | Homophones & Homographs | Context-based word selection, sentence correction, meaning disambiguation |
| 5 | Multisyllabic Words | Syllable splitting, pronunciation matching, word decoding |
| 6 | Spelling Review | Mixed review of weeks 1-5 topics |
| 7 | Spelling Mastery | Timed challenge across all spelling competencies |
| 8 | Quarterly Milestone | **Zone boss assessment** — cumulative spelling test |

**Boss: Word Warden Phase 1** — Focuses on word structure, spelling patterns, root/affix knowledge.

#### Zone 2: Archipelago Vocabulary Voyage (Q2)
**Focus:** Vocabulary Expansion and Word Relationships

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Similes & Metaphors | Figurative language identification, matching, sentence creation |
| 2 | Idioms & Proverbs | Meaning matching, context usage, cultural expressions |
| 3 | Word Analogies | Analogy completion, relationship identification |
| 4 | Connotation & Denotation | Tone identification, word choice comparison, context analysis |
| 5 | Domain-Specific Vocabulary | Subject-area word matching, definition recall, usage in context |
| 6 | Vocabulary Review | Mixed review |
| 7 | Vocabulary Mastery | Timed vocabulary challenge |
| 8 | Quarterly Milestone | Zone boss assessment |

**Boss: Word Warden Phase 2** — Vocabulary depth, figurative language, word relationships.

#### Zone 3: Narrative Highlands (Q3)
**Focus:** Reading Comprehension and Literary Analysis

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Author's Purpose | Passage reading + purpose identification (persuade/inform/entertain) |
| 2 | Point of View | Narrator identification, perspective analysis |
| 3 | Theme | Theme extraction from short passages, theme matching |
| 4 | Text Structure | Structure identification (cause-effect, compare-contrast, sequence) |
| 5 | Summarizing & Paraphrasing | Passage → summary selection, restatement accuracy |
| 6 | Comprehension Review | Mixed passage-based challenges |
| 7 | Comprehension Mastery | Timed reading comprehension challenge |
| 8 | Quarterly Milestone | Zone boss assessment |

**Boss: Word Warden Phase 3** — Reading comprehension, literary analysis, critical thinking.

#### Zone 4: Fluency Peaks & Mastery Summit (Q4)
**Focus:** Integrated Literacy Skills

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Root & Affixes Review | Integrated word structure challenges (Q1 callback) |
| 2 | Figurative Language | Integrated vocabulary challenges (Q2 callback) |
| 3 | Author's Purpose | Integrated comprehension (Q3 callback) |
| 4 | Point of View | Advanced perspective analysis |
| 5 | Theme | Cross-text theme comparison |
| 6 | Text Structure | Complex text structure identification |
| 7 | Summary & Vocabulary Review | Full integration review |
| 8 | Final Milestone | **World boss final battle** — Word Warden full encounter |

**Boss: Word Warden Final Battle** — All 4 quarters integrated. 5-phase encounter drawing from spelling, vocabulary, comprehension, and integrated skills.

---

### Grade 6 — Zone Breakdown

#### Zone 1: Mountain of Words (Q1)
**Focus:** Advanced Word Study and Vocabulary in Context

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Greek & Latin Roots | Etymology matching, root-meaning connections, word family trees |
| 2 | Word Derivations | Derivation chains, word evolution, morpheme analysis |
| 3 | Spelling Conventions & Patterns | Rule-based spelling, exception identification |
| 4 | Technical & Academic Vocabulary | Cross-domain vocabulary, formal definitions |
| 5 | Nuances in Word Meaning | Synonym gradient ranking, contextual meaning shifts |
| 6 | Word Study Review | Mixed review |
| 7 | Word Study Mastery | Timed word study challenge |
| 8 | Quarterly Milestone | Zone boss assessment |

#### Zone 2: Ocean of Language (Q2)
**Focus:** Advanced Vocabulary, Figurative Language, and Language Use

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Allusion & Symbolism | Literary device identification, meaning interpretation |
| 2 | Rhetorical Devices | Repetition/parallelism/contrast identification and effect analysis |
| 3 | Persuasive Language & Propaganda | Technique identification, bias detection |
| 4 | Tone & Mood | Tone classification, mood-evidence matching |
| 5 | Formal & Informal Language | Register identification, code-switching exercises |
| 6 | Language Review | Mixed review |
| 7 | Language Mastery | Timed language challenge |
| 8 | Quarterly Milestone | Zone boss assessment |

#### Zone 3: Chronicles of Comprehension (Q3)
**Focus:** Advanced Reading Comprehension and Critical Literacy

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Evaluating Arguments & Evidence | Argument strength ranking, evidence identification |
| 2 | Fact vs. Opinion | Statement classification, evidence-based reasoning |
| 3 | Comparing Multiple Texts | Cross-text analysis, viewpoint comparison |
| 4 | Synthesizing Information | Multi-source synthesis, integrated summary creation |
| 5 | Critical Evaluation of Media & Texts | Source reliability, media literacy, bias detection |
| 6 | Comprehension Review | Mixed review |
| 7 | Comprehension Mastery | Timed critical literacy challenge |
| 8 | Quarterly Milestone | Zone boss assessment |

#### Zone 4: Hall of Mastery (Q4)
**Focus:** Integrated Advanced Literacy Skills

| Week | Topic | Challenge Types |
|------|-------|----------------|
| 1 | Greek/Latin Root & Etymology Identification | Advanced etymology (Q1 callback) |
| 2 | Allusion & Symbolism Analysis | Deep literary analysis (Q2 callback) |
| 3 | Rhetorical Device Identification & Effect | Advanced rhetoric (Q2 callback) |
| 4 | Tone & Mood Tracking | Complex tone analysis across passages |
| 5 | Argument Evaluation | Advanced critical thinking (Q3 callback) |
| 6 | Multi-Text Comparison & Synthesis | Cross-text integration |
| 7 | Full Critical Evaluation with Media Literacy | Capstone comprehension challenge |
| 8 | Final Milestone | **Word Warden Final Battle** (Grade 6 version) |

---

## 4. World 2: Science Frontier + Health City (Science)

### Overview

| Aspect | Detail |
|--------|--------|
| **Subject** | Science (MATATAG-aligned) |
| **Hub name** | Science |
| **World bosses** | Contaminus (Matter/Life), Junklord (Health integration) |
| **Zones** | 4 (one per quarter) |
| **Topics per zone** | 8 (weekly) |
| **Challenge types** | Drag-and-sort, matching, lab simulations, diagram building, quizzes |

> **Note:** The original NutriMind.md describes Science and Health as separate worlds (Science Frontier + Health City). However, since we have 3 hubs (English, Science, PE+Health), Health content is split: **science-related health** (body systems, disease, nutrition) lives in the Science world; **lifestyle health** (mental health, substance prevention, safety) lives in the PE+Health world. See Section 5 for PE+Health world details.

### Grade 5 — Zone Breakdown

#### Zone 1: Matter Lab (Q1) — Science Frontier
**Focus:** Properties and Changes in Matter

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | States of Matter | Drag & Sort Objects | Classify solids (rock, wood, metal, ice), liquids (water, oil, juice), gases (air, steam) |
| 2 | Properties of Materials | Match Objects to Properties | Hard/soft, rough/smooth, flexible/rigid material classification |
| 3 | Uses of Materials | Build the Object | Choose correct materials for house, bottle, clothes, cooking pan |
| 4 | Physical Changes | Break & Change Objects | Cut, bend, crush, tear — identify reversible shape changes |
| 5 | Chemical Changes | Reaction Lab | Burning, cooking, rusting, spoiling — identify irreversible changes |
| 6 | Effects of Heat | Heat Control | Melting, freezing, boiling — temperature-change simulations |
| 7 | Proper Use of Materials | Recycling Challenge | Reduce, reuse, recycle sorting and application |
| 8 | Boss Battle | Mixed Challenge | **Contaminus Phase 1** — Matter mastery assessment |

#### Zone 2: Nature's Web (Q2) — Science Frontier
**Focus:** Living Things and Their Environment

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | Living vs Non-living | Sort Living & Non-living | Classify humans, plants, animals vs rocks, chairs, water |
| 2 | Basic Needs of Living Things | Survival Game | Food, water, air, shelter — identify organism needs |
| 3 | Plants & Animals | Sort Organisms | Classify into plant/animal categories, identify characteristics |
| 4 | Body Parts & Functions | Build the Body | Eyes→see, ears→hear, legs→walk — organ-function matching |
| 5 | Ecosystem | Build Ecosystem | Construct forest/ocean ecosystems with correct components |
| 6 | Food Chain | Connect Food Chain | Build food chains (grass→goat→human), identify producers/consumers |
| 7 | Caring for Environment | Save the Planet | Tree planting, cleanup activities — environmental stewardship |
| 8 | Boss Battle | Mixed Challenge | **Contaminus Phase 2** — Living things assessment |

#### Zone 3: Energy Core (Q3) — Science Frontier
**Focus:** Force and Energy

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | Push & Pull | Move the Object | Identify push (door, cart) and pull (rope, drawer) forces |
| 2 | Motion | Race Game | Fast/slow classification, direction identification |
| 3 | Effects of Force | Apply Force | Move ball, stop block, change shape of clay |
| 4 | Forms of Energy | Match Energy | Light (sun/bulb), heat (fire/stove), sound (drum/bell) |
| 5 | Sources of Energy | Sort Energy | Renewable (sun/wind) vs non-renewable (coal/oil) |
| 6 | Light & Sound | Experiment Lab | Reflection, shadows, loud/soft sound properties |
| 7 | Energy Conservation | Save Electricity | Turn off lights, unplug devices — conservation practices |
| 8 | Boss Battle | Mixed Challenge | **Volt Master** — Force & energy assessment |

#### Zone 4: Star Atlas (Q4) — Science Frontier
**Focus:** Earth and Space

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | Earth's Layers | Build Earth | Crust, mantle, core — layer identification and assembly |
| 2 | Landforms | Map Builder | Mountain, valley, plains — landform recognition |
| 3 | Bodies of Water | Water Map | Ocean, river, lake — water body identification |
| 4 | Weather | Forecast Game | Sunny, rainy, cloudy — weather type identification |
| 5 | Natural Resources | Resource Sorting | Water, trees, minerals — resource classification |
| 6 | Sun, Moon, Stars | Space Explore | Celestial body identification and properties |
| 7 | Day & Night | Earth Rotation | Day/night cycle explanation via Earth rotation |
| 8 | Boss Battle | Mixed Challenge | **Astro King** — Earth & space assessment |

---

### Grade 6 — Zone Breakdown

#### Zone 1: Particle Lab (Q1) — Science Frontier
**Focus:** Matter (Advanced)

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | Particle Nature of Matter | Arrange Particles | Particle spacing in solids (tight), liquids (spaced), gases (far apart) |
| 2 | Mass, Volume, Density | Measure Objects | Weight, space occupied, heavy/light ratio measurement |
| 3 | Mixtures & Solutions | Mix Substances | Mixture (sand+water) vs solution (sugar+water) distinction |
| 4 | Methods of Separation | Separation Lab | Filtering, sieving, evaporation techniques |
| 5 | Physical vs Chemical Change | Identify Changes | Cutting paper (physical) vs burning wood (chemical) |
| 6 | Heat Transfer | Heat Flow | Conduction (metal spoon), convection (boiling water), radiation (sunlight) |
| 7 | Uses of Materials | Problem Solving | Real-life material application (build bridge, make clothes) |
| 8 | Boss Battle | Mixed Challenge | **Contaminus Phase 1** (Grade 6 version) |

#### Zone 2: Body Systems Lab (Q2) — Health City
**Focus:** Living Things and Human Body (Advanced)

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | Cells | Build the Cell | Cell membrane, nucleus, cytoplasm — cell assembly |
| 2 | Human Body Systems Overview | System Matching | Digestive, respiratory, circulatory, nervous — system identification |
| 3 | Digestive System | Food Journey | Mouth→esophagus→stomach→intestines pathway simulation |
| 4 | Respiratory System | Breathing Simulation | Nose→trachea→lungs, oxygen/CO2 exchange |
| 5 | Circulatory System | Blood Flow Game | Heart, blood, vessels — nutrient/oxygen transport |
| 6 | Ecosystem & Interactions | Ecosystem Builder | Producers, consumers, environment relationships |
| 7 | Food Web & Environmental Issues | Food Web Connect | Food chain→web expansion, pollution/deforestation impact |
| 8 | Boss Battle | Mixed Challenge | **Bio Guardian X** — Body systems + ecology assessment |

#### Zone 3: Force Lab (Q3) — Science Frontier
**Focus:** Force, Motion & Energy (Advanced)

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | Types of Forces | Force Sorting | Gravity, friction, magnetism classification |
| 2 | Speed & Measurement | Speed Test | Distance/time calculations, fast vs slow comparison |
| 3 | Gravity & Friction | Force Experiment | Falling objects (gravity), rubbing surfaces (friction) |
| 4 | Energy Transformation | Energy Converter | Electrical→light, heat→motion conversions |
| 5 | Electricity | Circuit Builder | Battery, wire, bulb — circuit assembly |
| 6 | Magnetism | Magnet Test | Magnetic (iron) vs non-magnetic (wood) sorting |
| 7 | Energy Conservation | Energy Saver | Solar/wind energy applications, conservation methods |
| 8 | Boss Battle | Mixed Challenge | **Volt Master X** — Advanced force & energy assessment |

#### Zone 4: Cosmos Lab (Q4) — Science Frontier
**Focus:** Earth and Space (Advanced)

| Week | Topic | Game Mechanic | Content |
|------|-------|---------------|---------|
| 1 | Earth Structure | Layer Builder | Detailed crust, mantle, core with sub-layers |
| 2 | Plate Movement | Plate Simulation | Earthquake and volcano causes via tectonic movement |
| 3 | Weather Systems | Weather Control | Rain, wind, storm systems and formation |
| 4 | Climate Change | Climate Fix | Global warming, pollution — cause and effect analysis |
| 5 | Solar System | Planet Explorer | All planets identification and properties |
| 6 | Rotation & Revolution | Orbit Simulation | Day/night (rotation) and seasons (revolution) |
| 7 | Disaster Preparedness | Survival Mode | Earthquake, typhoon — safety procedures |
| 8 | Boss Battle | Mixed Challenge | **Astro King X** — Advanced Earth & space assessment |

---

## 5. World 3: PE Arena (PE + Health)

### Overview

| Aspect | Detail |
|--------|--------|
| **Subject** | Physical Education + Health (MATATAG-aligned) |
| **Hub name** | PE + Health |
| **World boss** | Idle Rex |
| **Zones** | 4 (one per quarter) |
| **Topics per zone** | 8 (weekly) |
| **Challenge types** | Movement recognition, fitness tracking, health quizzes, scenario-based decisions |

> **Curriculum note:** The DepEd MATATAG PE+Health curriculum guide available (`PE-and-HEALTH_CG-2023_Grade-4-and-7.md`) covers Grades 4 and 7 in detail, with only appendix tables for Grades 5-6. The PE game categories (Target Games Q1, Invasion Games Q2, Rhythmic Activities Q3-Q4) and Health content areas for Grades 5-6 are extracted from these appendix tables. **Specific weekly topic breakdowns are marked as [CURRICULUM TBD]** where Grade 5-6 DepEd content is not available and will need teacher input or a more complete curriculum guide.

### PE Game Categories (from DepEd Appendix)

| Quarter | PE Focus | Grade 5 Dance/Activity | Grade 6 Dance/Activity |
|---------|----------|----------------------|----------------------|
| Q1 | Target Games | Movement skills, aiming, precision | Advanced target games |
| Q2 | Invasion Games | Team-based movement, strategy | Advanced invasion games |
| Q3 | Rhythmic Activities & Dances | Dance Exercise, Movement Exploration, Fundamental Dance Movements, Social Dance Mixers | Dance Exercise, Dance Movements, Traditional Dances |
| Q4 | Rhythmic Activities & Dances | Dance Exercise, Movement Exploration, Fundamental Dance Movements, Social Dance Mixers | Dance Exercise, Dance Movements, Traditional Dances |

### Health Content Areas (from DepEd Appendix)

| Quarter | Grade 5 Health | Grade 6 Health |
|---------|---------------|---------------|
| Q1 | Mental and Emotional Health | Personal Health |
| Q2 | Growth and Development | Sexual and Reproductive Health |
| Q3 | Prevention of Substance Use | Disease Prevention and Control |
| Q4 | Safety and First Aid | Environmental Health |

### Grade 5 — Zone Breakdown

#### Zone 1: Target Range (Q1)
**PE Focus:** Target Games | **Health Focus:** Mental and Emotional Health

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Target Games: Aiming Basics | Movement recognition quiz | Proper aiming stance, throwing technique identification |
| 2 | Target Games: Precision | Tap-target mini-game | Accuracy challenges, hand-eye coordination |
| 3 | Target Games: Strategy | Scenario selection | Choose best strategy for target game situations |
| 4 | Mental Health: Emotions | Emotion identification quiz | Recognizing and naming emotions, emotion-situation matching |
| 5 | Mental Health: Coping Strategies | Scenario-based decisions | Choose healthy coping strategies for stress/anger/sadness |
| 6 | PE + Health Review | Mixed review | Combined target games + mental health review |
| 7 | Mastery Challenge | Timed mixed challenge | PE knowledge + health scenarios |
| 8 | Quarterly Milestone | Zone assessment | **Idle Rex Phase 1** |

#### Zone 2: Battle Arena (Q2)
**PE Focus:** Invasion Games | **Health Focus:** Growth and Development

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Invasion Games: Movement | Movement strategy quiz | Offensive/defensive movement identification |
| 2 | Invasion Games: Teamwork | Team scenario selection | Choose best team strategy, role identification |
| 3 | Invasion Games: Rules & Fair Play | Rules knowledge quiz | Sportsmanship, rules of common invasion games |
| 4 | Growth: Physical Changes | Information matching | Normal growth changes, body awareness |
| 5 | Growth: Healthy Habits for Growing | Scenario-based decisions | Nutrition, sleep, hygiene for development |
| 6 | PE + Health Review | Mixed review | Combined invasion games + growth review |
| 7 | Mastery Challenge | Timed mixed challenge | PE knowledge + health knowledge |
| 8 | Quarterly Milestone | Zone assessment | **Idle Rex Phase 2** |

#### Zone 3: Dance Floor (Q3)
**PE Focus:** Rhythmic Activities | **Health Focus:** Prevention of Substance Use

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Dance Exercise | Movement sequence quiz | Dance exercise steps, rhythm identification |
| 2 | Movement Exploration | Pattern recognition | Movement patterns, creative expression identification |
| 3 | Fundamental Dance Movements | Step identification | Basic dance steps and positions |
| 4 | Social Dance Mixers | Dance knowledge quiz | Social dance etiquette, mixer formations |
| 5 | Substance Use Prevention | Scenario-based decisions | Saying no to harmful substances, identifying dangers |
| 6 | PE + Health Review | Mixed review | Combined dance + substance prevention review |
| 7 | Mastery Challenge | Timed mixed challenge | PE + health integrated |
| 8 | Quarterly Milestone | Zone assessment | **Idle Rex Phase 3** |

#### Zone 4: Fitness Summit (Q4)
**PE Focus:** Rhythmic Activities (continued) | **Health Focus:** Safety and First Aid

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Dance Exercise (Advanced) | Advanced sequence quiz | Complex dance exercise routines |
| 2 | Movement Exploration (Advanced) | Pattern creation | Advanced movement patterns |
| 3 | Fundamental Dance Steps (Review) | Step mastery | Full dance step repertoire |
| 4 | Social Dance Mixers (Performance) | Performance knowledge | Social dance application scenarios |
| 5 | Safety & First Aid | Emergency scenario quiz | Identify hazards, choose correct first aid response |
| 6 | PE + Health Review | Mixed review | Year integration review |
| 7 | Mastery Challenge | Final mastery | Comprehensive PE + Health |
| 8 | Final Milestone | World boss battle | **Idle Rex Final Battle** |

---

### Grade 6 — Zone Breakdown

#### Zone 1: Precision Arena (Q1)
**PE Focus:** Target Games (Advanced) | **Health Focus:** Personal Health

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Target Games: Advanced Aiming | Strategy quiz | Advanced techniques, angle and force concepts |
| 2 | Target Games: Competition Strategy | Scenario selection | Tournament-style strategy decisions |
| 3 | Target Games: Rules & Officiating | Rules mastery quiz | Official rules, fair play, officiating basics |
| 4 | Personal Health: Hygiene | Knowledge quiz | Personal hygiene practices, disease prevention |
| 5 | Personal Health: Nutrition | Meal planning scenario | Balanced diet, food groups, healthy eating |
| 6 | PE + Health Review | Mixed review | Combined target games + personal health |
| 7 | Mastery Challenge | Timed mixed challenge | PE + health integrated |
| 8 | Quarterly Milestone | Zone assessment | **Idle Rex Phase 1** (Grade 6) |

#### Zone 2: Strategy Field (Q2)
**PE Focus:** Invasion Games (Advanced) | **Health Focus:** Sexual and Reproductive Health

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Invasion Games: Advanced Strategy | Tactical scenario quiz | Complex team strategies, play-calling |
| 2 | Invasion Games: Fitness Component | Fitness knowledge quiz | Endurance, speed, agility in games |
| 3 | Invasion Games: Leadership | Leadership scenario | Captain roles, team motivation, sportsmanship |
| 4 | Reproductive Health: Body Systems | Age-appropriate information quiz | Basic reproductive system understanding |
| 5 | Reproductive Health: Respect & Boundaries | Scenario-based decisions | Personal boundaries, respect, age-appropriate relationships |
| 6 | PE + Health Review | Mixed review | Combined review |
| 7 | Mastery Challenge | Timed mixed challenge | PE + health integrated |
| 8 | Quarterly Milestone | Zone assessment | **Idle Rex Phase 2** (Grade 6) |

#### Zone 3: Rhythm Hall (Q3)
**PE Focus:** Rhythmic Activities + Traditional Dances | **Health Focus:** Disease Prevention and Control

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Dance Exercise (Grade 6) | Sequence identification | Grade 6 level dance exercises |
| 2 | Dance Movements | Movement analysis | Advanced dance movements and positions |
| 3 | Traditional Dances: Introduction | Cultural knowledge quiz | Filipino traditional dance origins and significance |
| 4 | Traditional Dances: Steps & Formation | Step identification | Traditional dance steps, formations, costumes |
| 5 | Disease Prevention | Health scenario quiz | Common diseases, prevention methods, vaccination importance |
| 6 | PE + Health Review | Mixed review | Dance + disease prevention review |
| 7 | Mastery Challenge | Timed mixed challenge | PE + health integrated |
| 8 | Quarterly Milestone | Zone assessment | **Idle Rex Phase 3** (Grade 6) |

#### Zone 4: Champion's Court (Q4)
**PE Focus:** Rhythmic Activities + Traditional Dances (continued) | **Health Focus:** Environmental Health

| Week | Topic | Challenge Type | Content |
|------|-------|---------------|---------|
| 1 | Dance Exercise (Advanced) | Advanced sequence | Complex choreography knowledge |
| 2 | Traditional Dances (Performance) | Performance knowledge | Application and cultural context |
| 3 | Dance Creation & Expression | Creative scenario | Dance composition concepts |
| 4 | Environmental Health: Pollution | Cause-effect quiz | Air, water, land pollution — sources and effects |
| 5 | Environmental Health: Solutions | Action-based scenarios | Waste management, conservation, community health |
| 6 | PE + Health Review | Year integration review | Comprehensive review |
| 7 | Mastery Challenge | Final mastery | Comprehensive PE + Health |
| 8 | Final Milestone | World boss battle | **Idle Rex Final Battle** (Grade 6) |

---

## 6. Boss Battle System

### Boss Roster

| World | Quarter Boss | Final Boss | Grade 5 | Grade 6 |
|-------|-------------|------------|---------|---------|
| Literacy Island | Word Warden (phased) | Word Warden Final | Same boss, grade-appropriate content | Same boss, harder content |
| Science Frontier | Contaminus / Volt Master / Astro King | Contaminus Final | Q1-Q2: Contaminus, Q3: Volt Master, Q4: Astro King | Same structure, advanced content |
| PE Arena | Idle Rex (phased) | Idle Rex Final | Same boss, grade-appropriate content | Same boss, harder content |
| **Cross-World** | — | **Shadow Council** | Unlocks after ALL 3 world bosses defeated | Same |

### Boss Battle Mechanics

**Unlock condition:** ≥80% of zone challenges completed with ≥70% accuracy.

> **Boss battles are auto-generated from teacher-created challenges.** The server dynamically selects the hardest challenges (difficulty 4-5) from each topic in the zone at runtime. Teachers don't create separate boss content — they just create good challenges at various difficulty levels, and the system assembles the boss encounter automatically.

**Battle structure (per boss phase):**

1. **Phase 1 — Warm-up** (2 challenges, auto-selected Difficulty 2-3)
   - Basic recall from the zone's topics
   - Each correct answer deals damage to the boss HP bar

2. **Phase 2 — Core** (3 challenges, auto-selected Difficulty 3)
   - Application-level questions
   - Boss "attacks" between questions (narrative flavor; doesn't affect gameplay)

3. **Phase 3 — Pressure** (3 challenges, auto-selected Difficulty 4)
   - Analysis and synthesis questions
   - Time pressure increases (shorter answer windows)

4. **Phase 4 — Climax** (2 challenges, auto-selected Difficulty 5)
   - Hardest questions from the zone
   - Boss at low HP — dramatic moment

**HP System:**
- Boss has a visible HP bar (e.g., 1000 HP)
- Each correct answer deals damage: `base_damage × difficulty_multiplier`
- Wrong answers deal 0 damage but boss "heals" slightly (narrative: boss counterattacks)
- Student needs to answer enough correctly to deplete boss HP to zero

**Retry rules:**
- Failed boss battle can be retried (max 3 attempts per day)
- After 3 daily failures, student is routed back to zone review topics
- Boss resets with different question selection on each retry (auto-selected from the same pool of teacher-created challenges)

### Shadow Council (Grand Final Boss)

**Unlock condition:** ALL 3 world final bosses defeated.

**Structure:**
- 5 rounds, each pulling from a different domain:
  1. **Round 1:** English challenge (from Literacy Island)
  2. **Round 2:** Science challenge (from Science Frontier)
  3. **Round 3:** Health challenge (from Health City / PE Arena health topics)
  4. **Round 4:** PE challenge (from PE Arena)
  5. **Round 5:** Cross-subject integration — a challenge that connects concepts from all subjects

**Special mechanics:**
- Shadow Council has 3 "council members" — visual representation of the difficulty
- Each round targets a different council member
- Cross-subject round requires answering a multi-part question
- Performance determines overall **Hero Power Level** and **achievement rank** (Bronze/Silver/Gold/Platinum)

---

## 7. Adaptive Learning Engine

### Competency Scoring

Each student has a **competency score per topic** (0-100%).

**Score calculation:**
- Updated after every challenge submission
- Uses exponential weighted moving average — recent attempts matter more
- Formula: `new_score = (0.7 × latest_result) + (0.3 × previous_score)`

### Difficulty Mapping

| Competency Score | Difficulty Level | Behavior |
|-----------------|-----------------|----------|
| 0-30% | 1 (Beginner) | More hints, simpler questions, visual aids |
| 31-50% | 2 (Developing) | Standard questions, some hints available |
| 51-70% | 3 (Proficient) | Moderate difficulty, hints must be earned |
| 71-85% | 4 (Advanced) | Harder questions, minimal hints |
| 86-100% | 5 (Mastery) | Expert-level, time pressure, boss-eligible |

### Adaptive Behavior

- **Challenge selection:** Server prioritizes topics with lowest competency scores (weakest areas first)
- **Difficulty adjustment:**
  - 3+ correct in a row at current difficulty → bump up one level
  - 3+ wrong in a row → bump down one level + offer hint-enabled challenges
- **Remediation:** If a student drops below 30% on a previously-passed topic, the zone re-opens that topic for review
- **Acceleration:** Students at Mastery (86%+) on all zone topics automatically unlock the boss battle, even before Week 8

---

## 8. Daily Challenge Card

Every login presents a **Daily Challenge Card** with 4 mini-challenges:

| Card Item | Subject | Challenge Type |
|-----------|---------|---------------|
| **Word of the Day** | English | Definition matching, usage in sentence, etymology |
| **Science Discovery** | Science | Fun fact + quick quiz question |
| **Health Fact** | Health | Health tip + scenario question |
| **PE Move of the Day** | PE | Movement identification or fitness fact quiz |

### Daily Challenge Rules

- Available once per day (resets at midnight, server time)
- Each item awards **15 Hero Power points** on completion
- Completing all 4 items awards a **bonus 20 points** (total: 80 per day)
- Content is drawn from the student's current zone topics (adaptive)
- In offline mode, daily challenges are pre-cached for 3 days ahead

---

## 9. Gamification System

### Badges

**Zone Completion Badges** — Awarded for completing all 8 topics in a zone:
- Forest of Words Explorer (English Q1 Grade 5)
- Mountain of Words Scholar (English Q1 Grade 6)
- *(One badge per zone, per grade — 24 total zone badges)*

**World Completion Badges:**
- Literacy Champion (completed Literacy Island)
- Science Pioneer (completed Science Frontier)
- Fitness Hero (completed PE Arena)

**Boss Defeat Badges:**
- Word Warden Slayer
- Contaminus Vanquisher
- Idle Rex Conqueror
- Shadow Council Victor (rarest badge)

**Special Achievement Badges:**
- Perfect Week (100% accuracy for 7 consecutive days)
- Streak Master (30-day login streak)
- Speed Demon (complete a challenge in under 10 seconds, correctly)
- Helping Hand (cross-world bonus mission completed)
- Night Owl (complete daily challenge after 6 PM)
- Early Bird (complete daily challenge before 8 AM)

### Streak System

- **Daily streak:** Increments when student completes at least 1 challenge per day
- **Streak bonuses:**
  - 3 days → +10 Hero Power
  - 7 days → +50 Hero Power + "Week Warrior" badge (first time)
  - 14 days → +100 Hero Power
  - 30 days → +200 Hero Power + "Streak Master" badge (first time)
- **Streak freeze:** Not available (design decision — encourages consistent engagement)
- **Streak reset:** Missing a day resets streak to 0

### Hero Power Level

**Hero Power Level** is the student's overall progression indicator, calculated from:

| Activity | Points |
|----------|--------|
| Challenge correct (first try) | +10 × difficulty level |
| Challenge correct (retry) | +5 × difficulty level |
| Boss phase completed | +50 |
| Boss defeated | +200 |
| Badge earned | +25 to +100 (varies by badge rarity) |
| Daily challenge item completed | +15 |
| Daily challenge full completion bonus | +20 |
| Streak bonus (7 days) | +50 |
| Streak bonus (30 days) | +200 |
| Cross-world bonus mission | +150 |

**Hero Power Ranks:**

| Hero Power | Rank | Visual |
|-----------|------|--------|
| 0-500 | Recruit | Basic avatar |
| 501-1500 | Guardian | Bronze armor effect |
| 1501-3000 | Champion | Silver armor effect |
| 3001-5000 | Legend | Gold armor effect |
| 5001+ | Mythic | Platinum glow effect |

> Avatar visually upgrades at each rank threshold — reflecting academic growth through game progression.

### Leaderboard

**Hub Leaderboard:**
- Ranked by Hero Power Level within a specific teacher's hub
- Updated in real-time via WebSocket
- Shows top 10 + student's own rank
- Weekly reset option (configurable by teacher)

**Global Leaderboard:**
- Ranked by Hero Power Level across all hubs for the same grade level
- Grade 5 and Grade 6 have separate leaderboards
- Updated every 15 minutes (server-side cron job)

### Cross-World Bonus Missions

Special missions that span multiple subjects (available after completing at least 1 zone in 2+ worlds):

- "Science of Words" — English vocabulary + Science concept integration
- "Healthy Literacy" — Reading comprehension + Health topic integration
- "Fit for Knowledge" — PE concept + Science/Health integration

Each bonus mission awards **150 Hero Power** and a special badge on first completion.

---

## 10. Online vs Offline Mode Comparison

| Feature | Online Mode | Offline Mode |
|---------|-------------|-------------|
| **Purpose** | Full learning experience | Practice / preparation |
| **Server validation** | Yes — all answers server-validated | No — local validation only |
| **Progress tracking** | Server-side, counts toward grades | Local storage only |
| **Grade impact** | Yes (Written Work 25%, Performance 50%, Assessment 25%) | No — practice only |
| **Boss battles** | Available (server-validated) | Not available |
| **Leaderboard** | Real-time, visible | Not available |
| **Daily challenges** | Fresh daily from server | Pre-cached (3 days) |
| **Hub/server code** | Required to join | Not required |
| **Content source** | Server API | Cached content pack (~700KB) |
| **Sync on reconnect** | N/A (always online) | No sync — modes are independent |
| **Avatar updates** | Real-time | Local only |
| **Badges** | Awarded and tracked server-side | Practice badges (local only) |
| **Adaptive difficulty** | Full adaptive engine | Simplified local adaptation |

### Offline Content Pack

Downloaded when student goes online. Contains:

| Content | Size Estimate |
|---------|---------------|
| Current zone challenges (all difficulties) | ~500KB JSON |
| Next zone preview (week 1 only) | ~100KB |
| Daily challenges (next 3 days) | ~50KB |
| Badge definitions | ~20KB |
| World/zone metadata | ~30KB |
| **Total** | **~700KB** (compressible) |

---

## 11. Grading System (Online Mode Only)

### DepEd MATATAG Weight Distribution

| Component | Weight | Source |
|-----------|--------|--------|
| **Written Work** | 25% | Challenge results (quizzes, matching, fill-in-blank) |
| **Performance Task** | 50% | Boss battles, cross-world missions, extended challenges |
| **Quarterly Assessment** | 25% | Week 8 milestone assessment (zone boss) |

### Grade Computation

- Grades follow DepEd numerical scale: **75 to 100**
- Computed per hub (per subject, per quarter)
- Teacher can trigger grade recomputation at any time
- Exportable as CSV per student, per class, per subject

### At-Risk Detection

Students are flagged as **at-risk** when:
- Overall grade drops below 75 in any subject
- Competency score drops below 30% on 3+ topics in a single zone
- No activity for 5+ consecutive days
- Boss battle failed 3 times on the same zone

Teachers receive **real-time SSE alerts** + dashboard notifications for at-risk students.

---

## 12. Speech Recognition (Literacy Island Only)

### Fluency Falls Zone

A special zone within Literacy Island that uses speech processing:

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| **Words Per Minute** | Reading speed | Grade 5: 100-120 WPM; Grade 6: 120-140 WPM |
| **Accuracy** | Correctly pronounced words | ≥95% for mastery |
| **Prosody** | Expression, phrasing, intonation | Rubric-scored (1-4 scale) |

> **Implementation note:** Speech recognition requires microphone access on the Android device. This feature is **online-only** (requires server-side processing). The speech module is a stretch goal — not required for MVP but designed into the architecture.

---

## 13. Challenge Type Reference

### English Challenge Types

| Type | Mechanic | Used In |
|------|----------|---------|
| Word-root matching | Drag word to correct root | Spelling zones |
| Fill-in-the-blank | Type or select missing word | All zones |
| Word building | Assemble word from morphemes | Spelling zones |
| Figurative language ID | Identify simile/metaphor/idiom | Vocabulary zones |
| Passage + questions | Read passage, answer MCQ | Comprehension zones |
| Summary selection | Choose best summary of passage | Comprehension zones |
| Analogy completion | Complete A:B :: C:? | Vocabulary zones |
| Tone classification | Identify tone/mood of passage | Grade 6 zones |
| Argument evaluation | Rate argument strength | Grade 6 Q3-Q4 |

### Science Challenge Types

| Type | Mechanic | Used In |
|------|----------|---------|
| Drag & Sort | Classify objects into categories | Matter, living things |
| Match Objects | Connect items to properties | Properties, body systems |
| Build the Object | Assemble from correct parts | Ecosystem, cell, Earth layers |
| Reaction Lab | Predict outcomes of reactions | Chemical changes, heat |
| Connect Chain | Build food chain/web | Living things |
| Circuit Builder | Wire a working circuit | Electricity (Grade 6) |
| Diagram Labeling | Label parts of diagrams | Body systems, Earth, solar system |
| Simulation | Interactive virtual experiment | Heat, force, motion |

### PE + Health Challenge Types

| Type | Mechanic | Used In |
|------|----------|---------|
| Movement recognition | Identify correct form/technique | PE all zones |
| Tap-target mini-game | Timed precision tapping | Target games |
| Scenario decision | Choose best action in situation | Health all zones |
| Rules quiz | MCQ on game rules | Invasion/target games |
| Step identification | Name dance steps from images | Rhythm/dance zones |
| Emotion matching | Match emotion to scenario | Mental health (Gr5 Q1) |
| First aid sequence | Order correct first aid steps | Safety (Gr5 Q4, Gr6 Q4) |
| Meal planning | Build balanced meal from options | Nutrition (Gr6 Q1) |

---

## 14. Open Items

| Item | Status | Notes |
|------|--------|-------|
| PE+Health Grade 5-6 detailed weekly topics | `[CURRICULUM TBD]` | Only appendix tables available; need full DepEd CG for Grades 5-6 PE+Health |
| Speech recognition provider | TBD | Options: Web Speech API, Google Cloud Speech-to-Text, or Mozilla DeepSpeech |
| Avatar asset design | TBD | Requires artist/designer input for hero customization assets |
| Boss battle animations | TBD | Unity-side implementation details |
| Traditional dance content (Grade 6 Q3-Q4) | `[CURRICULUM TBD]` | Specific Filipino traditional dances for Grade 6 not specified in available docs |
| Daily Challenge content authoring | TBD | Who creates the daily challenge items? Auto-generated or teacher-authored? |
