// Builds The Odin Project curriculum, the Full Stack JavaScript path.
//
// Source: theodinproject.com/paths/full-stack-javascript and its seven course
// pages, read 2026-10-09. TRANSCRIBED, not designed — unlike Godot, Drawing,
// Aseprite and Piano, this curriculum already exists and is maintained by
// somebody else. Nothing here is an opinion about what should be studied; it
// is the path as it stands, in its order, with its own lesson names.
//
// FOUR LEVELS INTO THREE. Odin nests path → course → section → lesson, and the
// schema holds curriculum → module → lesson. So a SECTION is a module and the
// course it belongs to rides on the name: "NodeJS · Express". This is the exact
// case 0003_curriculums.sql anticipated when it chose three levels — "Odin's
// NodeJS path has sections with lessons inside them" — and collapsing course
// and section into one label is the part it left to be decided here.
//
// Courses are not numbered. The other curriculums open a module with a stage
// number because their order is the argument; here the course name says where
// you are, and a 1-to-34 sequence across seven courses would say nothing a
// reader wants.
//
// NO DETAIL, DELIBERATELY. 0007_lesson_detail.sql states the rule: detail is
// nullable "because for a transcribed curriculum the substance is in the
// resource". Every lesson below is a page on theodinproject.com that holds its
// own material and is kept current by people who maintain it. Restating it
// here would duplicate what the link already gives, and the copy would go stale
// the first time Odin edited a lesson. The same rule is why Greek and Japanese
// carry none either.
//
// Prints SQL. Nothing is executed here.

const SOURCE = 'https://www.theodinproject.com/paths/full-stack-javascript';
const NAME = 'The Odin Project';

// Foundations is not here. It is taken before a path is chosen and is not part
// of this one, and it is long finished — Odin Recipes, the landing page,
// Rock Paper Scissors, Etch-a-Sketch and the calculator are all in
// ~/Work/Master Roachi/odin-projects.
const courses = [
  {
    course: 'Intermediate HTML and CSS',
    sections: [
      {
        name: 'Intermediate HTML Concepts',
        lessons: ['Introduction', 'SVG', 'Tables'],
      },
      {
        name: 'Intermediate CSS Concepts',
        lessons: [
          'Default Styles',
          'CSS Units',
          'More Text Styles',
          'More CSS Properties',
          'Advanced Selectors',
          'Positioning',
          'CSS Functions',
          'Custom Properties',
          'Browser Compatibility',
          'Frameworks and Preprocessors',
        ],
      },
      {
        name: 'Forms',
        lessons: ['Form Basics', 'Form Validation', 'Project: Sign-up Form'],
      },
      {
        name: 'Grid',
        lessons: [
          'Introduction to Grid',
          'Creating a Grid',
          'Positioning Grid Elements',
          'Advanced Grid Properties',
          'Using Flexbox and Grid',
          'Project: Admin Dashboard',
        ],
      },
    ],
  },
  {
    course: 'JavaScript',
    sections: [
      { name: 'Introduction', lessons: ['How This Course Will Work'] },
      {
        name: 'Organizing Your JavaScript Code',
        lessons: [
          'Organizing Code with Objects',
          'Object Constructors',
          'Project: Library',
          'Factory Functions and the Module Pattern',
          'Project: Tic Tac Toe',
          'Classes',
          'ES6 Modules',
          'npm',
          'Webpack',
          'Project: Restaurant Page',
          'Revisiting Webpack',
          'JSON',
          'OOP Principles',
          'Project: Todo List',
        ],
      },
      {
        name: 'JavaScript in the Real World',
        lessons: ['Linting', 'Form Validation with JavaScript', 'ECMAScript'],
      },
      {
        name: 'Asynchronous JavaScript and APIs',
        lessons: [
          'Asynchronous Code',
          'Working with APIs',
          'Async and Await',
          'Project: Weather App',
        ],
      },
      {
        name: 'Testing JavaScript',
        lessons: ['Testing Basics', 'Project: Testing Practice', 'More Testing'],
      },
      {
        name: 'A Bit of Computer Science',
        lessons: [
          'A Very Brief Intro to CS',
          'Recursive Methods',
          'Project: Recursion',
          'Time Complexity',
          'Space Complexity',
          'Common Data Structures and Algorithms',
          'Project: Linked Lists',
          'HashMap Data Structure',
          'Project: HashMap',
          'Project: Binary Search Trees',
          'Project: Knights Travails',
        ],
      },
      {
        name: 'Intermediate Git',
        lessons: [
          'A Deeper Look at Git',
          'Working with Remotes',
          'Using Git in the Real World',
        ],
      },
      {
        name: 'Finishing Up with JavaScript',
        lessons: ['Project: Battleship', 'Conclusion'],
      },
    ],
  },
  {
    course: 'Advanced HTML and CSS',
    sections: [
      { name: 'Animation', lessons: ['Transforms', 'Transitions', 'Keyframes'] },
      {
        name: 'Accessibility',
        lessons: [
          'Introduction to Web Accessibility',
          'The Web Content Accessibility Guidelines (WCAG)',
          'Semantic HTML',
          'Accessible Colors',
          'Keyboard Navigation',
          'Meaningful Text',
          'WAI-ARIA',
          'Accessibility Auditing',
        ],
      },
      {
        name: 'Responsive Design',
        lessons: [
          'Introduction to Responsive Design',
          'Natural Responsiveness',
          'Responsive Images',
          'Media Queries',
          'Project: Homepage',
        ],
      },
    ],
  },
  {
    course: 'React',
    sections: [
      {
        name: 'Introduction',
        lessons: [
          'How This Course Will Work',
          'Introduction To React',
          'Setting Up A React Environment',
        ],
      },
      {
        name: 'Getting Started With React',
        lessons: [
          'React Components',
          'What Is JSX?',
          'Passing Data Between Components',
          'Rendering Techniques',
          'Keys In React',
        ],
      },
      {
        name: 'States And Effects',
        lessons: [
          'Introduction To State',
          'More On State',
          'Project: CV Application',
          'How To Deal With Side Effects',
          'Project: Memory Card',
        ],
      },
      {
        name: 'Class Components',
        lessons: ['Class Based Components', 'Component Lifecycle Methods'],
      },
      {
        name: 'React Testing',
        lessons: ['Introduction To React Testing', 'Mocking Callbacks And Components'],
      },
      {
        name: 'The React Ecosystem',
        lessons: [
          'React Router',
          'Fetching Data In React',
          'Styling React Applications',
          'Project: Shopping Cart',
        ],
      },
      {
        name: 'More React Concepts',
        lessons: [
          'Managing State With The Context API',
          'Reducing State',
          'Refs And Memoization',
        ],
      },
      { name: 'Conclusion', lessons: ['Conclusion'] },
    ],
  },
  {
    course: 'Databases',
    sections: [
      {
        name: 'Databases',
        lessons: ['Databases', 'Databases and SQL', 'Project: SQL Zoo'],
      },
    ],
  },
  {
    course: 'NodeJS',
    sections: [
      {
        name: 'Introduction to NodeJS',
        lessons: [
          'Introduction to the Back End',
          'Introduction: What is NodeJS?',
          'Getting Started',
          'Debugging Node',
          'Project: Basic Informational Site',
          'Environment Variables',
        ],
      },
      {
        name: 'Express',
        lessons: [
          'Introduction to Frameworks',
          'Introduction to Express',
          'Routes',
          'Controllers',
          'Views',
          'Project: Mini Message Board',
          'Deployment',
          'Forms and Data Handling',
          'Installing PostgreSQL',
          'Using PostgreSQL',
          'Project: Inventory Application',
        ],
      },
      {
        name: 'Authentication',
        lessons: ['Authentication Basics', 'Project: Members Only'],
      },
      { name: 'ORMs', lessons: ['Prisma ORM', 'Project: File Uploader'] },
      { name: 'APIs', lessons: ['API Basics', 'API Security', 'Project: Blog API'] },
      {
        name: 'Testing Express',
        lessons: ['Testing Routes and Controllers', 'Testing Database Operations'],
      },
      {
        name: 'Full Stack Projects',
        lessons: [
          "Project: Where's Waldo (A Photo Tagging App)",
          'Project: Messaging App',
        ],
      },
      { name: 'Final project', lessons: ['Project: Odin-Book', 'Conclusion'] },
    ],
  },
  {
    // OFF THE ROUTE. See OFF_ROUTE below.
    course: 'Getting Hired',
    sections: [
      {
        name: 'Preparing for Your Job Search',
        lessons: [
          'How This Course Will Work',
          'Professional Networking',
          'Strategy',
          'It Starts with YOU',
          'What Companies Want',
          'What You Can Do to Prepare',
          'Project: Building Your Personal Website',
        ],
      },
      {
        name: 'Applying to and Interviewing for Jobs',
        lessons: [
          'Collecting Job Leads',
          'Qualifying Job Leads',
          'Project: Building Your Resume',
          'Applying for Web Development Jobs',
          'Preparing to Interview and Interviewing',
          'Handling a Job Offer',
          'Conclusion',
        ],
      },
    ],
  },
];

/* Courses that are on the path and not on the route.
 *
 * This is the column 0006_routes.sql was added for: "what is being asked is
 * '18 of the 41 I am actually doing'". Without something switched off it does
 * nothing, and the honest answer for this path is one whole course.
 *
 * GETTING HIRED. Fourteen lessons about networking, job leads, a CV and
 * interviewing. SPEC.md settles the question for the site and the same answer
 * holds here: "This is a personal brand site, not a portfolio for job
 * applications ... That framing is dead." A course whose deliverables are a
 * resume and a personal website built to be hired with is not work he is
 * doing.
 *
 * It stays in the curriculum rather than being deleted, because it is really
 * on the path and a reader should see that the choice was made rather than
 * that the course does not exist. One toggle per lesson in the dashboard puts
 * it back. */
const OFF_ROUTE = new Set(['Getting Hired']);

/** SQL single-quoted string. An apostrophe in a title ends the literal early. */
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;

const out = [
  '-- Generated by scripts/curriculums/odin.mjs. Read before running.',
  // Rebuildable without losing its place. The row is created only if it is not
  // already there, and its modules are cleared instead — deleting the
  // curriculum and reinserting it would take a new position at the end, and
  // curriculum order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select ${q(NAME)}, ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(new Date().toISOString())}\n` +
    `  where not exists (select 1 from curriculums where name = ${q(NAME)});`,
  `update curriculums set source = ${q(SOURCE)} where name = ${q(NAME)};`,
  // Lessons first, then modules. ON DELETE CASCADE covers this wherever foreign
  // keys are enforced — D1 enforces them — and silently does nothing where they
  // are not, orphaning every lesson instead of removing it so that a rebuild
  // quietly adds a second full set nobody can see, because every read joins
  // through modules. Written out rather than relied upon.
  `delete from lessons where module_id in\n` +
    `  (select id from modules where curriculum_id =\n` +
    `     (select id from curriculums where name = ${q(NAME)}));`,
  `delete from modules where curriculum_id =\n` +
    `  (select id from curriculums where name = ${q(NAME)});`,
];

let modules = 0;
let lessons = 0;
let off = 0;

for (const { course, sections } of courses) {
  const onRoute = OFF_ROUTE.has(course) ? 0 : 1;

  for (const section of sections) {
    modules += 1;
    out.push(
      `insert into modules (curriculum_id, name, position)\n` +
        `  values ((select id from curriculums where name = ${q(NAME)}), ` +
        `${q(`${course} · ${section.name}`)}, ${modules});`,
    );

    section.lessons.forEach((lesson, l) => {
      lessons += 1;
      if (!onRoute) off += 1;
      out.push(
        `insert into lessons (module_id, name, position, on_route)\n` +
          `  values ((select max(id) from modules), ${q(lesson)}, ${l + 1}, ${onRoute});`,
      );
    });
  }
}

/* WHAT IS ALREADY DONE IS NOT TICKED HERE, and that is deliberate.
 *
 * Five of the seven courses are finished and so is the first NodeJS project —
 * twenty-four projects sit in ~/Work/Master Roachi/odin-projects, and the
 * handoff notes in that repository walk through the JavaScript CS section,
 * testing, Advanced HTML and CSS, React, databases and NodeJS in order.
 *
 * The dates are not recoverable. That repository's history gives 2026-09-03
 * for twenty of the twenty-four, which is the day it was reorganised and not
 * the day anything was learned; only five folders carry a date that looks like
 * real work (the landing page and admin dashboard on 28 July, the library on
 * 3 August, tic-tac-toe on the 4th, the restaurant page on the 8th).
 *
 * done_on is a DATE and not a boolean on purpose — 0003's comment: "knowing a
 * lesson is done is worth less than knowing when". Filling 114 of them with a
 * day the work did not happen would destroy exactly what the column was chosen
 * for, and it cannot be undone afterwards because the real dates are gone.
 *
 * So they are left null, and the backfill is one statement with a date Master
 * Roachi supplies rather than one this script invents. Everything up to and
 * including the first NodeJS project:
 *
 *   update lessons set done_on = '<the date he gives>'
 *    where module_id in (select id from modules where curriculum_id =
 *            (select id from curriculums where name = 'The Odin Project'))
 *      and (module_id, position) <= (
 *            select module_id, position from lessons
 *             where name = 'Project: Basic Informational Site'
 *               and module_id in (select id from modules where curriculum_id =
 *                     (select id from curriculums where name = 'The Odin Project')));
 *
 * The dashboard also takes a day per lesson — the curriculums API accepts a
 * supplied `day` "for catching up on something done yesterday" — so ticking
 * them by hand records real dates where he remembers them. */

console.log(out.join('\n'));
console.error(
  `modules: ${modules}  lessons: ${lessons}  ` +
    `on route: ${lessons - off}  off route: ${off}`,
);
