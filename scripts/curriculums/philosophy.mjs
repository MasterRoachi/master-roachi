// Philosophy — the Western canon, from the Presocratics to philosophy now. The
// plan and every ruling are in scripts/curriculums/philosophy.md; this file is
// the structure. The material is in philosophy-detail.json and the cards in
// philosophy-cards.json, keyed by lesson name.
//
//   npm run curriculum philosophy       # the live database
//
// THE RULE FOR THIS ONE: an argument is stated as its best defender would, with
// the strongest objections and replies, and the verdict left open. Quotations
// come only from public-domain translations fetched and checked word for word;
// anything in copyright is paraphrased and says so.

import detail from './philosophy-detail.json' with { type: 'json' };
import cards from './philosophy-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/philosophy.md';
const NAME = 'Philosophy';

const q = (value) =>
  value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`;

const NOW = new Date().toISOString();
const CURRICULUM = `(select id from curriculums where name = ${q(NAME)})`;
/** The lesson just inserted. The other scripts use the same trick. */
const LESSON = '(select max(id) from lessons)';

/** Every key asked for, so a stray one in a data file can be found. */
const askedDetail = new Set();
const askedCards = new Set();
const missing = [];

function detailFor(name) {
  askedDetail.add(name);
  const text = detail[name];
  if (text === undefined) {
    // Loud rather than silent: a lesson renamed here and not in the data file
    // would otherwise quietly lose its material.
    missing.push(name);
    return null;
  }
  return text;
}

/**
 * A card's natural key, which is what the database matches on: curriculum,
 * kind and front. Two lessons claiming the same one is a silent bug -- the
 * insert is `where not exists`, so the second claim does not fail, it just
 * quietly re-points the card at the later lesson. Caught here instead.
 */
const claimed = new Map();
const twiceClaimed = [];

function cardsFor(name) {
  askedCards.add(name);
  const list = cards[name] ?? [];
  for (const card of list) {
    const key = `${card.kind}\u0000${card.front}`;
    if (claimed.has(key)) twiceClaimed.push([card.front, claimed.get(key), name]);
    else claimed.set(key, name);
  }
  return list;
}

/**
 * A lesson is either a bare name or [name, sources]. Sources are per-lesson
 * rows in `sources`; the curriculum's OWN list (lesson_id is null) is
 * dashboard-owned and no script regenerates it.
 */
const nameOf = (lesson) => (Array.isArray(lesson) ? lesson[0] : lesson);
const sourcesOf = (lesson) => (Array.isArray(lesson) ? (lesson[1] ?? []) : []);

// The stages, each lesson with its own sources. Generated from the stage
// files when the curriculum is written; edit the lesson there, not here.
const stages = [
  {
    "name": "Stage 1 · How to read an argument",
    "lessons": [
      [
        "Context: where philosophy came from, and what it is",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Presocratic Philosophy",
            "url": "https://plato.stanford.edu/entries/presocratics/",
            "note": "Free. The Milesians and their successors."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Thales of Miletus",
            "url": "https://iep.utm.edu/thales/",
            "note": "Free."
          },
          {
            "title": "Aristotle, Metaphysics, Book I, tr. W. D. Ross",
            "url": "https://classics.mit.edu/Aristotle/metaphysics.1.i.html",
            "note": "Internet Classics Archive. Source of the 'wonder' passage."
          }
        ]
      ],
      [
        "The branches of philosophy I: metaphysics, epistemology, logic and ethics",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Metaphysics",
            "url": "https://plato.stanford.edu/entries/metaphysics/",
            "note": "Free. Includes the history of the word."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Epistemology",
            "url": "https://iep.utm.edu/epistemo/",
            "note": "Free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Ethics",
            "url": "https://iep.utm.edu/ethics/",
            "note": "Free. Normative, applied and metaethics."
          }
        ]
      ],
      [
        "The branches of philosophy II: politics, aesthetics, mind, religion and science",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Aesthetics",
            "url": "https://iep.utm.edu/aesthetics/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Philosophy of Religion",
            "url": "https://plato.stanford.edu/entries/philosophy-religion/",
            "note": "Free."
          },
          {
            "title": "MIT OpenCourseWare 24.01, Classics of Western Philosophy",
            "url": "https://ocw.mit.edu/courses/24-01-classics-of-western-philosophy-spring-2016/",
            "note": "Free course materials; the shape of the canon."
          }
        ]
      ],
      [
        "What an argument is: premises, conclusions and hidden premises",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Argument",
            "url": "https://iep.utm.edu/argument/",
            "note": "Free."
          },
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          }
        ]
      ],
      [
        "Validity and soundness: the two questions to ask of any argument",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Validity and Soundness",
            "url": "https://iep.utm.edu/val-snd/",
            "note": "Free."
          },
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Logical Consequence",
            "url": "https://plato.stanford.edu/entries/logical-consequence/",
            "note": "Free. Advanced: what 'follows from' means."
          }
        ]
      ],
      [
        "Deduction, induction and abduction: three ways of reasoning",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Deductive and Inductive Arguments",
            "url": "https://iep.utm.edu/deductive-inductive/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: The Problem of Induction",
            "url": "https://plato.stanford.edu/entries/induction-problem/",
            "note": "Free. Hume's argument and the replies."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Abduction",
            "url": "https://plato.stanford.edu/entries/abduction/",
            "note": "Free. Peirce and inference to the best explanation."
          }
        ]
      ],
      [
        "Conditionals: if, only if, necessary and sufficient conditions",
        [
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Richard Zach, Boxes and Diamonds: An Open Introduction to Modal Logic",
            "url": "https://bd.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project): modal logic and counterfactual conditionals."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Indicative Conditionals",
            "url": "https://plato.stanford.edu/entries/conditionals/",
            "note": "Free. Includes the Oswald examples."
          }
        ]
      ],
      [
        "Modus ponens and modus tollens, and their fallacious mirror images",
        [
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Ancient Logic",
            "url": "https://plato.stanford.edu/entries/logic-ancient/",
            "note": "Free. Chrysippus and the Stoic indemonstrables."
          }
        ]
      ],
      [
        "More valid forms: the dilemma, the disjunctive syllogism and reductio ad absurdum",
        [
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Socrates",
            "url": "https://iep.utm.edu/socrates/",
            "note": "Free. The elenchus, the Socratic method of refutation."
          }
        ]
      ],
      [
        "Propositional logic: atoms, connectives and symbols",
        [
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Propositional Logic",
            "url": "https://iep.utm.edu/prop-log/",
            "note": "Free. Includes the history from the Stoics to Frege."
          }
        ]
      ],
      [
        "Truth tables: defining the connectives, and the puzzle of the material conditional",
        [
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Indicative Conditionals",
            "url": "https://plato.stanford.edu/entries/conditionals/",
            "note": "Free. The material conditional, Grice, Adams and Edgington."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Propositional Logic",
            "url": "https://plato.stanford.edu/entries/logic-propositional/",
            "note": "Free. More formal."
          }
        ]
      ],
      [
        "Testing an argument with a truth table",
        [
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Classical Logic",
            "url": "https://plato.stanford.edu/entries/logic-classical/",
            "note": "Free. Advanced."
          }
        ]
      ],
      [
        "Quantifiers in brief: all, some and none",
        [
          {
            "title": "P. D. Magnus, Tim Button et al., forall x: Calgary — A Free and Open Introduction to Formal Logic",
            "url": "https://forallx.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project), free PDF and HTML."
          },
          {
            "title": "Richard Zach, Boxes and Diamonds: An Open Introduction to Modal Logic",
            "url": "https://bd.openlogicproject.org/",
            "note": "Open textbook (Open Logic Project): modal logic and counterfactual conditionals."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Quantifiers and Quantification",
            "url": "https://plato.stanford.edu/entries/quantification/",
            "note": "Free."
          }
        ]
      ],
      [
        "Informal fallacies I: attacking the person and other failures of relevance",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Fallacies",
            "url": "https://iep.utm.edu/fallacy/",
            "note": "Free. A long alphabetical catalogue."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Fallacies",
            "url": "https://plato.stanford.edu/entries/fallacies/",
            "note": "Free. The history from Aristotle, and the modern debate."
          }
        ]
      ],
      [
        "Informal fallacies II: begging the question, false dilemmas and equivocation",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Fallacies",
            "url": "https://iep.utm.edu/fallacy/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Fallacies",
            "url": "https://plato.stanford.edu/entries/fallacies/",
            "note": "Free."
          }
        ]
      ],
      [
        "Definitions and counterexamples: the Socratic test",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Definitions",
            "url": "https://plato.stanford.edu/entries/definitions/",
            "note": "Free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Gettier Problems",
            "url": "https://iep.utm.edu/gettier/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: The Analysis of Knowledge",
            "url": "https://plato.stanford.edu/entries/knowledge-analysis/",
            "note": "Free."
          }
        ]
      ],
      [
        "Thought experiments: Gyges' ring, the trolley and the Chinese room",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Thought Experiments",
            "url": "https://plato.stanford.edu/entries/thought-experiment/",
            "note": "Free. Includes Galileo's falling bodies."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: The Chinese Room Argument",
            "url": "https://plato.stanford.edu/entries/chinese-room/",
            "note": "Free. Searle's argument and the replies."
          }
        ]
      ],
      [
        "How to read a philosophical text",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Plato",
            "url": "https://plato.stanford.edu/entries/plato/",
            "note": "Free. On reading the dialogues and who speaks for Plato."
          },
          {
            "title": "MIT OpenCourseWare 24.01, Classics of Western Philosophy",
            "url": "https://ocw.mit.edu/courses/24-01-classics-of-western-philosophy-spring-2016/",
            "note": "Free course materials."
          }
        ]
      ],
      [
        "Reading: Plato's Euthyphro and the dilemma of piety",
        [
          {
            "title": "Plato, Euthyphro, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1642",
            "note": "Public domain, Project Gutenberg. Source of every quotation."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Plato's Shorter Ethical Works",
            "url": "https://plato.stanford.edu/entries/plato-ethics-shorter/",
            "note": "Free. Includes the Euthyphro."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Divine Command Theory",
            "url": "https://iep.utm.edu/divine-c/",
            "note": "Free. The dilemma's later life."
          }
        ]
      ],
      [
        "The principle of charity: arguing with the strongest version",
        [
          {
            "title": "John Stuart Mill, On Liberty (1859)",
            "url": "https://www.gutenberg.org/ebooks/34901",
            "note": "Public domain, Project Gutenberg. Chapter 2 is the source of the quotations."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Donald Davidson",
            "url": "https://plato.stanford.edu/entries/davidson/",
            "note": "Free. Charity in radical interpretation."
          }
        ]
      ],
      [
        "Looking back: the toolkit, and the Presocratics who first used it",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Ancient Logic",
            "url": "https://plato.stanford.edu/entries/logic-ancient/",
            "note": "Free. The Greek origins of the toolkit."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Presocratic Philosophy",
            "url": "https://plato.stanford.edu/entries/presocratics/",
            "note": "Free. Preparation for Stage 2."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 2 · Before Socrates",
    "lessons": [
      [
        "Context: the Greek world of the sixth and fifth centuries BC",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Presocratic Philosophy",
            "url": "https://plato.stanford.edu/entries/presocratics/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Presocratics",
            "url": "https://iep.utm.edu/presocra/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "Hesiod, Theogony, tr. H. G. Evelyn-White (1914)",
            "url": "https://www.gutenberg.org/ebooks/348",
            "note": "Public domain, Project Gutenberg. The mythic account the first philosophers moved beyond."
          }
        ]
      ],
      [
        "The fragments and the doxography: how we know the Presocratics",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Doxography of Ancient Philosophy",
            "url": "https://plato.stanford.edu/entries/doxography-ancient/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Aristotle, Metaphysics Book I, tr. W. D. Ross",
            "url": "https://classics.mit.edu/Aristotle/metaphysics.1.i.html",
            "note": "Internet Classics Archive. Aristotle's history of his predecessors, the source of most doxography."
          }
        ]
      ],
      [
        "Thales of Miletus: water and the first natural explanation",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Thales of Miletus",
            "url": "https://iep.utm.edu/thales/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          }
        ]
      ],
      [
        "Anaximander: the boundless and the first cosmos",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Anaximander",
            "url": "https://iep.utm.edu/anaximan/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          }
        ]
      ],
      [
        "Anaximenes: air, condensation and rarefaction",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Anaximenes",
            "url": "https://iep.utm.edu/anaximen/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Presocratic Philosophy",
            "url": "https://plato.stanford.edu/entries/presocratics/",
            "note": "Free online; scholarly survey with bibliography."
          }
        ]
      ],
      [
        "Xenophanes: the critique of the Homeric gods and the limits of knowledge",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Xenophanes",
            "url": "https://plato.stanford.edu/entries/xenophanes/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Xenophanes",
            "url": "https://iep.utm.edu/xenoph/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          }
        ]
      ],
      [
        "Pythagoras and the Pythagoreans: number, harmony and the soul",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Pythagoras",
            "url": "https://plato.stanford.edu/entries/pythagoras/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Pythagoreanism",
            "url": "https://plato.stanford.edu/entries/pythagoreanism/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Pythagoras",
            "url": "https://iep.utm.edu/pythagoras/",
            "note": "Free online; introductory survey."
          }
        ]
      ],
      [
        "Heraclitus: the Logos, flux and the unity of opposites",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Heraclitus",
            "url": "https://plato.stanford.edu/entries/heraclitus/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Heraclitus",
            "url": "https://iep.utm.edu/heraclit/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          }
        ]
      ],
      [
        "Parmenides: the way of truth and the impossibility of not-being",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Parmenides",
            "url": "https://plato.stanford.edu/entries/parmenides/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Parmenides",
            "url": "https://iep.utm.edu/parmenid/",
            "note": "Free online; introductory survey."
          }
        ]
      ],
      [
        "Reading: Parmenides on the two ways and the signs of what is",
        [
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Parmenides",
            "url": "https://plato.stanford.edu/entries/parmenides/",
            "note": "Free online; scholarly survey with bibliography."
          }
        ]
      ],
      [
        "Interpreting Parmenides: strict monism and its rivals",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Parmenides",
            "url": "https://plato.stanford.edu/entries/parmenides/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Parmenides",
            "url": "https://iep.utm.edu/parmenid/",
            "note": "Free online; introductory survey."
          }
        ]
      ],
      [
        "Zeno of Elea: the paradoxes against plurality",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Zeno of Elea",
            "url": "https://plato.stanford.edu/entries/zeno-elea/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Zeno's Paradoxes",
            "url": "https://plato.stanford.edu/entries/paradox-zeno/",
            "note": "Free online; scholarly survey with bibliography."
          }
        ]
      ],
      [
        "Zeno's paradoxes of motion: the dichotomy, Achilles, the arrow and the stadium",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Zeno's Paradoxes",
            "url": "https://plato.stanford.edu/entries/paradox-zeno/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Zeno's Paradoxes",
            "url": "https://iep.utm.edu/zenos-paradoxes/",
            "note": "Free online; introductory survey."
          }
        ]
      ],
      [
        "Melissus of Samos: Eleatic monism in prose",
        [
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Presocratic Philosophy",
            "url": "https://plato.stanford.edu/entries/presocratics/",
            "note": "Free online; scholarly survey with bibliography."
          }
        ]
      ],
      [
        "Empedocles: the four roots, Love and Strife",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Empedocles",
            "url": "https://plato.stanford.edu/entries/empedocles/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Empedocles",
            "url": "https://iep.utm.edu/empedocl/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          }
        ]
      ],
      [
        "Anaxagoras: everything in everything, and Mind",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Anaxagoras",
            "url": "https://plato.stanford.edu/entries/anaxagoras/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Anaxagoras",
            "url": "https://iep.utm.edu/anaxagor/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          }
        ]
      ],
      [
        "Leucippus and Democritus: atoms and the void",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Leucippus",
            "url": "https://plato.stanford.edu/entries/leucippus/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Democritus",
            "url": "https://plato.stanford.edu/entries/democritus/",
            "note": "Free online; scholarly survey with bibliography."
          }
        ]
      ],
      [
        "Democritus on knowledge and the cheerful life",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Democritus",
            "url": "https://plato.stanford.edu/entries/democritus/",
            "note": "Free online; scholarly survey with bibliography."
          }
        ]
      ],
      [
        "The Sophists: teachers of virtue for a fee",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: The Sophists",
            "url": "https://plato.stanford.edu/entries/sophists/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Sophists",
            "url": "https://iep.utm.edu/sophists/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "Xenophon, The Memorabilia, tr. H. G. Dakyns",
            "url": "https://www.gutenberg.org/ebooks/1177",
            "note": "Public domain, Project Gutenberg. Book II, chapter 1 retells Prodicus' Choice of Heracles."
          }
        ]
      ],
      [
        "Protagoras: man the measure, and the gods unknown",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Protagoras",
            "url": "https://plato.stanford.edu/entries/protagoras/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Protagoras",
            "url": "https://iep.utm.edu/protagor/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "Plato, Theaetetus, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1726",
            "note": "Public domain, Project Gutenberg. The measure doctrine and its refutation (152a, 171a)."
          }
        ]
      ],
      [
        "Gorgias: On What Is Not and the power of speech",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: Gorgias",
            "url": "https://iep.utm.edu/gorgias/",
            "note": "Free online; introductory survey."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: The Sophists",
            "url": "https://plato.stanford.edu/entries/sophists/",
            "note": "Free online; scholarly survey with bibliography."
          }
        ]
      ],
      [
        "Nomos and physis: is justice natural or only custom?",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: The Sophists",
            "url": "https://plato.stanford.edu/entries/sophists/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "Plato, Gorgias, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1672",
            "note": "Public domain, Project Gutenberg. Callicles' speech on nature and convention (483b-484a)."
          },
          {
            "title": "Plato, Protagoras, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1591",
            "note": "Public domain, Project Gutenberg. Protagoras' myth (320c) and Hippias on law as tyrant (337c)."
          }
        ]
      ],
      [
        "Looking back: from the Milesians to the Sophists",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Presocratic Philosophy",
            "url": "https://plato.stanford.edu/entries/presocratics/",
            "note": "Free online; scholarly survey with bibliography."
          },
          {
            "title": "John Burnet, Early Greek Philosophy (2nd ed., 1908)",
            "url": "https://www.gutenberg.org/ebooks/67097",
            "note": "Public domain, Project Gutenberg. Translations of the fragments, with commentary."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 3 · Socrates and Plato",
    "lessons": [
      [
        "Context: Athens in the age of Socrates and Plato",
        [
          {
            "title": "SEP: Socrates",
            "url": "https://plato.stanford.edu/entries/socrates/",
            "note": "Stanford Encyclopedia of Philosophy. Free. Its opening sections set out Socrates' Athens, the war and the Thirty."
          },
          {
            "title": "SEP: The Sophists",
            "url": "https://plato.stanford.edu/entries/sophists/",
            "note": "Stanford Encyclopedia of Philosophy. Free. The teachers of persuasion, and the nomos–physis debate."
          }
        ]
      ],
      [
        "The Socratic problem: Plato, Xenophon and Aristophanes",
        [
          {
            "title": "SEP: Socrates",
            "url": "https://plato.stanford.edu/entries/socrates/",
            "note": "Stanford Encyclopedia of Philosophy. Free. Includes a section on the Socratic problem and the sources."
          },
          {
            "title": "Xenophon, The Memorabilia, tr. H. G. Dakyns",
            "url": "https://www.gutenberg.org/ebooks/1177",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Aristophanes, The Clouds",
            "url": "http://classics.mit.edu/Aristophanes/clouds.html",
            "note": "Public domain, Internet Classics Archive (MIT)."
          }
        ]
      ],
      [
        "Plato's dialogues: early, middle and late",
        [
          {
            "title": "SEP: Plato",
            "url": "https://plato.stanford.edu/entries/plato/",
            "note": "Stanford Encyclopedia of Philosophy. Free. On the dialogue form, the corpus and the problems of chronology."
          },
          {
            "title": "IEP: Plato",
            "url": "https://iep.utm.edu/plato/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The elenchus: how Socrates refuted",
        [
          {
            "title": "IEP: Socrates",
            "url": "https://iep.utm.edu/socrates/",
            "note": "Internet Encyclopedia of Philosophy. Free. Includes the Socratic method and the elenchus."
          },
          {
            "title": "SEP: Plato's Shorter Ethical Works",
            "url": "https://plato.stanford.edu/entries/plato-ethics-shorter/",
            "note": "Stanford Encyclopedia of Philosophy. Free. The Laches, Charmides, Lysis and the other early dialogues."
          },
          {
            "title": "Plato, Laches, tr. Benjamin Jowett",
            "url": "http://classics.mit.edu/Plato/laches.html",
            "note": "Public domain, Internet Classics Archive (MIT)."
          }
        ]
      ],
      [
        "Socratic ignorance and the oracle at Delphi",
        [
          {
            "title": "Plato, Apology, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1656",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "IEP: Apology",
            "url": "https://iep.utm.edu/apology/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The trial of Socrates and the Apology",
        [
          {
            "title": "Plato, Apology, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1656",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Xenophon, The Apology, tr. H. G. Dakyns",
            "url": "https://www.gutenberg.org/ebooks/1171",
            "note": "Public domain, Project Gutenberg. Xenophon's version of the defence."
          },
          {
            "title": "IEP: Apology",
            "url": "https://iep.utm.edu/apology/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The Crito: why Socrates would not escape",
        [
          {
            "title": "Plato, Crito, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1657",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SEP: Plato's Shorter Ethical Works",
            "url": "https://plato.stanford.edu/entries/plato-ethics-shorter/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Euthyphro's dilemma: is the pious loved because it is pious?",
        [
          {
            "title": "Plato, Euthyphro, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1642",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "IEP: Divine Command Theory",
            "url": "https://iep.utm.edu/divine-c/",
            "note": "Internet Encyclopedia of Philosophy. Free. The modern dilemma and the replies."
          },
          {
            "title": "SEP: Theological Voluntarism",
            "url": "https://plato.stanford.edu/entries/voluntarism-theological/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Virtue as knowledge: no one does wrong willingly",
        [
          {
            "title": "SEP: Plato's Ethics: An Overview",
            "url": "https://plato.stanford.edu/entries/plato-ethics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Plato, Gorgias, tr. Benjamin Jowett",
            "url": "http://classics.mit.edu/Plato/gorgias.html",
            "note": "Public domain, Internet Classics Archive (MIT)."
          }
        ]
      ],
      [
        "Akrasia: the Protagoras and weakness of will",
        [
          {
            "title": "Plato, Protagoras, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1591",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SEP: Weakness of Will",
            "url": "https://plato.stanford.edu/entries/weakness-will/",
            "note": "Stanford Encyclopedia of Philosophy. Free. From Socrates and Aristotle to Davidson."
          }
        ]
      ],
      [
        "Meno's paradox and the theory of recollection",
        [
          {
            "title": "Plato, Meno, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1643",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "IEP: Plato's Meno",
            "url": "https://iep.utm.edu/meno/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The Meno: the slave boy and knowledge versus true belief",
        [
          {
            "title": "IEP: Plato's Meno",
            "url": "https://iep.utm.edu/meno/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: The Analysis of Knowledge",
            "url": "https://plato.stanford.edu/entries/knowledge-analysis/",
            "note": "Stanford Encyclopedia of Philosophy. Free. From true belief plus an account to Gettier."
          }
        ]
      ],
      [
        "The Phaedo: four arguments for the immortality of the soul",
        [
          {
            "title": "Plato, Phaedo, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1658",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "IEP: Plato: Phaedo",
            "url": "https://iep.utm.edu/phaedo/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Ancient Theories of Soul",
            "url": "https://plato.stanford.edu/entries/ancient-soul/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Plato's theory of Forms",
        [
          {
            "title": "SEP: Plato's Middle Period Metaphysics and Epistemology",
            "url": "https://plato.stanford.edu/entries/plato-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy. Free. The Forms and the arguments for them."
          },
          {
            "title": "IEP: Plato",
            "url": "https://iep.utm.edu/plato/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The Symposium: love and the ladder of beauty",
        [
          {
            "title": "Plato, Symposium, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1600",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SEP: Plato on Friendship and Eros",
            "url": "https://plato.stanford.edu/entries/plato-friendship/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Republic I: Thrasymachus and justice as the advantage of the stronger",
        [
          {
            "title": "Plato, The Republic, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1497",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "IEP: Plato: The Republic",
            "url": "https://iep.utm.edu/republic/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Republic II: Glaucon's challenge and the ring of Gyges",
        [
          {
            "title": "SEP: Plato's Ethics and Politics in The Republic",
            "url": "https://plato.stanford.edu/entries/plato-ethics-politics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Plato: The Republic",
            "url": "https://iep.utm.edu/republic/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The Republic's city and soul analogy",
        [
          {
            "title": "SEP: Plato's Ethics and Politics in The Republic",
            "url": "https://plato.stanford.edu/entries/plato-ethics-politics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Plato, The Republic, tr. Benjamin Jowett",
            "url": "http://classics.mit.edu/Plato/republic.html",
            "note": "Public domain, Internet Classics Archive (MIT)."
          }
        ]
      ],
      [
        "The tripartite soul and Plato's definition of justice",
        [
          {
            "title": "SEP: Plato's Ethics and Politics in The Republic",
            "url": "https://plato.stanford.edu/entries/plato-ethics-politics/",
            "note": "Stanford Encyclopedia of Philosophy. Free. Includes the parts of the soul and the Sachs problem."
          },
          {
            "title": "SEP: Ancient Theories of Soul",
            "url": "https://plato.stanford.edu/entries/ancient-soul/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Philosopher-kings and the three waves",
        [
          {
            "title": "SEP: Plato's Ethics and Politics in The Republic",
            "url": "https://plato.stanford.edu/entries/plato-ethics-politics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Plato: The Republic",
            "url": "https://iep.utm.edu/republic/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The sun and the divided line",
        [
          {
            "title": "SEP: Plato's Middle Period Metaphysics and Epistemology",
            "url": "https://plato.stanford.edu/entries/plato-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy. Free. The sun, the line and the cave."
          },
          {
            "title": "Plato, The Republic, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1497",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Reading: the allegory of the cave (Republic VII)",
        [
          {
            "title": "Plato, The Republic, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1497",
            "note": "Public domain, Project Gutenberg. The text quoted in this lesson; Book VII opens with the cave."
          },
          {
            "title": "SEP: Plato's Middle Period Metaphysics and Epistemology",
            "url": "https://plato.stanford.edu/entries/plato-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The decline of constitutions and the happiest life",
        [
          {
            "title": "SEP: Plato's Ethics and Politics in The Republic",
            "url": "https://plato.stanford.edu/entries/plato-ethics-politics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Plato: The Republic",
            "url": "https://iep.utm.edu/republic/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Republic X: the quarrel with the poets and the myth of Er",
        [
          {
            "title": "SEP: Plato on Rhetoric and Poetry",
            "url": "https://plato.stanford.edu/entries/plato-rhetoric/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Plato's Myths",
            "url": "https://plato.stanford.edu/entries/plato-myths/",
            "note": "Stanford Encyclopedia of Philosophy. Free. Includes the myth of Er."
          },
          {
            "title": "SEP: Plato's Aesthetics",
            "url": "https://plato.stanford.edu/entries/plato-aesthetics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The Theaetetus: three attempts to define knowledge",
        [
          {
            "title": "SEP: Plato on Knowledge in the Theaetetus",
            "url": "https://plato.stanford.edu/entries/plato-theaetetus/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Plato, Theaetetus, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1726",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "The Parmenides and the Third Man argument",
        [
          {
            "title": "SEP: Plato's Parmenides",
            "url": "https://plato.stanford.edu/entries/plato-parmenides/",
            "note": "Stanford Encyclopedia of Philosophy. Free. The objections to the Forms and the Third Man."
          },
          {
            "title": "Plato, Parmenides, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1687",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "The Sophist: not-being and the greatest kinds",
        [
          {
            "title": "Plato, Sophist, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1735",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Plato, Sophist, tr. Benjamin Jowett (Internet Classics Archive)",
            "url": "http://classics.mit.edu/Plato/sophist.html",
            "note": "Public domain, Internet Classics Archive (MIT)."
          }
        ]
      ],
      [
        "The Timaeus: the craftsman and the likely story",
        [
          {
            "title": "SEP: Plato's Timaeus",
            "url": "https://plato.stanford.edu/entries/plato-timaeus/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Plato: The Timaeus",
            "url": "https://iep.utm.edu/timaeus/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Plato, Timaeus, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1572",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "The Laws: the second-best city",
        [
          {
            "title": "SEP: Plato's Laws",
            "url": "https://plato.stanford.edu/entries/plato-laws/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Plato, Laws, tr. Benjamin Jowett",
            "url": "https://www.gutenberg.org/ebooks/1750",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Looking back: what Socrates and Plato left the West",
        [
          {
            "title": "SEP: Plato",
            "url": "https://plato.stanford.edu/entries/plato/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Socrates",
            "url": "https://plato.stanford.edu/entries/socrates/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 4 · Aristotle",
    "lessons": [
      [
        "Context: Athens, Macedon and the Academy in the fourth century BC",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle",
            "url": "https://plato.stanford.edu/entries/aristotle/",
            "note": "Stanford Encyclopedia of Philosophy, free. The best single overview."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle",
            "url": "https://iep.utm.edu/aristotl/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Aristotle's life, the Lyceum and the surviving corpus",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle",
            "url": "https://plato.stanford.edu/entries/aristotle/",
            "note": "Stanford Encyclopedia of Philosophy, free. The best single overview."
          },
          {
            "title": "Diogenes Laertius, Lives and Opinions of Eminent Philosophers, tr. C. D. Yonge",
            "url": "https://www.gutenberg.org/ebooks/57342",
            "note": "Project Gutenberg, public domain. Book V opens with Aristotle's life and will."
          }
        ]
      ],
      [
        "Aristotle's Categories: substance and the ten kinds of being",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Categories",
            "url": "https://plato.stanford.edu/entries/aristotle-categories/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Categories, tr. E. M. Edghill",
            "url": "http://classics.mit.edu/Aristotle/categories.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's logic: the square of opposition and the syllogism",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Logic",
            "url": "https://plato.stanford.edu/entries/aristotle-logic/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: The Traditional Square of Opposition",
            "url": "https://plato.stanford.edu/entries/square/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Prior Analytics, tr. A. J. Jenkinson",
            "url": "http://classics.mit.edu/Aristotle/prior.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Posterior Analytics: demonstration and first principles",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Logic",
            "url": "https://plato.stanford.edu/entries/aristotle-logic/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Logic",
            "url": "https://iep.utm.edu/aris-log/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Posterior Analytics, tr. G. R. G. Mure",
            "url": "http://classics.mit.edu/Aristotle/posterior.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Topics: dialectic and reasoning from reputable opinions",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Logic",
            "url": "https://plato.stanford.edu/entries/aristotle-logic/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Topics, tr. W. A. Pickard-Cambridge",
            "url": "http://classics.mit.edu/Aristotle/topics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          },
          {
            "title": "Aristotle, On Sophistical Refutations, tr. W. A. Pickard-Cambridge",
            "url": "http://classics.mit.edu/Aristotle/sophist_refut.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Physics: nature as an inner source of change",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Natural Philosophy",
            "url": "https://plato.stanford.edu/entries/aristotle-natphil/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Physics, tr. R. P. Hardie and R. K. Gaye",
            "url": "http://classics.mit.edu/Aristotle/physics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's four causes and the case for purpose in nature",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle on Causality",
            "url": "https://plato.stanford.edu/entries/aristotle-causality/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Natural Philosophy",
            "url": "https://plato.stanford.edu/entries/aristotle-natphil/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Physics, tr. R. P. Hardie and R. K. Gaye",
            "url": "http://classics.mit.edu/Aristotle/physics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle on change: potentiality, actuality and the definition of motion",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Natural Philosophy",
            "url": "https://plato.stanford.edu/entries/aristotle-natphil/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Motion and its Place in Nature",
            "url": "https://iep.utm.edu/aris-mot/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Physics, tr. R. P. Hardie and R. K. Gaye",
            "url": "http://classics.mit.edu/Aristotle/physics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle on the infinite, place, void and time",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Natural Philosophy",
            "url": "https://plato.stanford.edu/entries/aristotle-natphil/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle and Mathematics",
            "url": "https://plato.stanford.edu/entries/aristotle-mathematics/",
            "note": "Stanford Encyclopedia of Philosophy, free. Includes the potential infinite."
          },
          {
            "title": "Aristotle, Physics, tr. R. P. Hardie and R. K. Gaye",
            "url": "http://classics.mit.edu/Aristotle/physics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Metaphysics: first philosophy and being qua being",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Metaphysics",
            "url": "https://plato.stanford.edu/entries/aristotle-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Metaphysics",
            "url": "https://iep.utm.edu/aristotle-metaphysics/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Metaphysics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/metaphysics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's defence of the principle of non-contradiction",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle on Non-contradiction",
            "url": "https://plato.stanford.edu/entries/aristotle-noncontradiction/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Metaphysics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/metaphysics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Metaphysics Zeta: substance, form, matter and essence",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Metaphysics",
            "url": "https://plato.stanford.edu/entries/aristotle-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Form vs. Matter",
            "url": "https://plato.stanford.edu/entries/form-matter/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Metaphysics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/metaphysics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's unmoved mover: Physics VIII and Metaphysics Lambda",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Metaphysics",
            "url": "https://plato.stanford.edu/entries/aristotle-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Natural Philosophy",
            "url": "https://plato.stanford.edu/entries/aristotle-natphil/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Metaphysics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/metaphysics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's On the Soul: the soul as the form of the living body",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Psychology",
            "url": "https://plato.stanford.edu/entries/aristotle-psychology/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Ancient Theories of Soul",
            "url": "https://plato.stanford.edu/entries/ancient-soul/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, On the Soul, tr. J. A. Smith",
            "url": "http://classics.mit.edu/Aristotle/soul.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's ladder of souls: nutrition, perception and thought",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Psychology",
            "url": "https://plato.stanford.edu/entries/aristotle-psychology/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, On the Soul, tr. J. A. Smith",
            "url": "http://classics.mit.edu/Aristotle/soul.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's active intellect: the controversy over De Anima III.5",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Psychology, supplement on the Active Mind of De Anima iii 5",
            "url": "https://plato.stanford.edu/entries/aristotle-psychology/active-mind.html",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle Commentators",
            "url": "https://plato.stanford.edu/entries/aristotle-commentators/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, On the Soul, tr. J. A. Smith",
            "url": "http://classics.mit.edu/Aristotle/soul.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle the biologist: the History and Parts of Animals",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Biology",
            "url": "https://plato.stanford.edu/entries/aristotle-biology/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Biology",
            "url": "https://iep.utm.edu/aris-bio/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, On the Parts of Animals, tr. William Ogle",
            "url": "http://classics.mit.edu/Aristotle/parts_animals.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Nicomachean Ethics: eudaimonia and the highest good",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Ethics",
            "url": "https://plato.stanford.edu/entries/aristotle-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Ethics",
            "url": "https://iep.utm.edu/aris-eth/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Nicomachean Ethics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/nicomachaen.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Reading: Aristotle's function argument (Nicomachean Ethics I.7)",
        [
          {
            "title": "Aristotle, Nicomachean Ethics Book I, tr. W. D. Ross (1908)",
            "url": "http://classics.mit.edu/Aristotle/nicomachaen.1.i.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation. The text read in this lesson; I.7 is section 7."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Ethics",
            "url": "https://plato.stanford.edu/entries/aristotle-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Aristotle on virtue as a mean",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Ethics",
            "url": "https://plato.stanford.edu/entries/aristotle-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Ethics",
            "url": "https://iep.utm.edu/aris-eth/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Nicomachean Ethics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/nicomachaen.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle on voluntary action and choice",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Ethics",
            "url": "https://plato.stanford.edu/entries/aristotle-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Nicomachean Ethics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/nicomachaen.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle on practical wisdom and akrasia",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Ethics",
            "url": "https://plato.stanford.edu/entries/aristotle-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Weakness of Will",
            "url": "https://plato.stanford.edu/entries/weakness-will/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Nicomachean Ethics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/nicomachaen.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle on friendship",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Ethics",
            "url": "https://plato.stanford.edu/entries/aristotle-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Friendship",
            "url": "https://plato.stanford.edu/entries/friendship/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Nicomachean Ethics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/nicomachaen.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle on contemplation and the happiest life",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Ethics",
            "url": "https://plato.stanford.edu/entries/aristotle-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Ethics",
            "url": "https://iep.utm.edu/aris-eth/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Nicomachean Ethics, tr. W. D. Ross",
            "url": "http://classics.mit.edu/Aristotle/nicomachaen.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Politics: the polis by nature, and the problem of natural slavery",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Political Theory",
            "url": "https://plato.stanford.edu/entries/aristotle-politics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Politics",
            "url": "https://iep.utm.edu/aris-pol/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Politics, tr. Benjamin Jowett",
            "url": "http://classics.mit.edu/Aristotle/politics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Politics: constitutions, the middle class and the best regime",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Political Theory",
            "url": "https://plato.stanford.edu/entries/aristotle-politics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Politics, tr. Benjamin Jowett",
            "url": "http://classics.mit.edu/Aristotle/politics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          },
          {
            "title": "Aristotle (attributed), The Athenian Constitution, tr. F. G. Kenyon",
            "url": "http://classics.mit.edu/Aristotle/athenian_const.html",
            "note": "Internet Classics Archive (MIT), free."
          }
        ]
      ],
      [
        "Aristotle's Rhetoric: ethos, pathos, logos and the enthymeme",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Rhetoric",
            "url": "https://plato.stanford.edu/entries/aristotle-rhetoric/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Rhetoric, tr. W. Rhys Roberts",
            "url": "http://classics.mit.edu/Aristotle/rhetoric.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Aristotle's Poetics: tragedy, plot and catharsis",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle's Aesthetics",
            "url": "https://plato.stanford.edu/entries/aristotle-aesthetics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Aristotle, Poetics",
            "url": "https://iep.utm.edu/aris-poe/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aristotle, Poetics, tr. S. H. Butcher",
            "url": "http://classics.mit.edu/Aristotle/poetics.html",
            "note": "Internet Classics Archive (MIT), free; Oxford translation."
          }
        ]
      ],
      [
        "Looking back: what Aristotle settled and what he left open",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle",
            "url": "https://plato.stanford.edu/entries/aristotle/",
            "note": "Stanford Encyclopedia of Philosophy, free. The best single overview."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Aristotle Commentators",
            "url": "https://plato.stanford.edu/entries/aristotle-commentators/",
            "note": "Stanford Encyclopedia of Philosophy, free. His afterlife in late antiquity."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 5 · After Aristotle: the schools and Plotinus",
    "lessons": [
      [
        "Context: the Hellenistic world after Alexander",
        [
          {
            "title": "Cosmopolitanism",
            "url": "https://plato.stanford.edu/entries/cosmopolitanism/",
            "note": "Stanford Encyclopedia of Philosophy, free. Opens with the Cynics and Stoics."
          },
          {
            "title": "Ancient Political Philosophy",
            "url": "https://plato.stanford.edu/entries/ancient-political/",
            "note": "Stanford Encyclopedia of Philosophy, free. Includes the Hellenistic schools."
          },
          {
            "title": "Plato: The Academy",
            "url": "https://iep.utm.edu/academy/",
            "note": "Internet Encyclopedia of Philosophy, free. The school's history after Plato."
          }
        ]
      ],
      [
        "Diogenes and the Cynics: living according to nature",
        [
          {
            "title": "Cynics",
            "url": "https://iep.utm.edu/cynics/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Diogenes of Sinope",
            "url": "https://iep.utm.edu/diogenes-of-sinope/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Diogenes Laertius, Lives and Opinions of Eminent Philosophers, tr. C. D. Yonge (1853)",
            "url": "https://www.gutenberg.org/ebooks/57342",
            "note": "Public domain, Project Gutenberg. The ancient source for most of the anecdotes."
          }
        ]
      ],
      [
        "Epicurus: atoms, void and the swerve",
        [
          {
            "title": "Epicurus",
            "url": "https://plato.stanford.edu/entries/epicurus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Epicurus",
            "url": "https://iep.utm.edu/epicur/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Epicurus on pleasure: the absence of pain and the limits of desire",
        [
          {
            "title": "Epicurus, Letter to Menoeceus, tr. R. D. Hicks",
            "url": "https://classics.mit.edu/Epicurus/menoec.html",
            "note": "Internet Classics Archive, free."
          },
          {
            "title": "Epicurus, Principal Doctrines, tr. R. D. Hicks",
            "url": "https://classics.mit.edu/Epicurus/princdoc.html",
            "note": "Internet Classics Archive, free."
          },
          {
            "title": "Epicurus",
            "url": "https://plato.stanford.edu/entries/epicurus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Epicurus on death: \"nothing to us\" and the fourfold remedy",
        [
          {
            "title": "Epicurus, Letter to Menoeceus, tr. R. D. Hicks",
            "url": "https://classics.mit.edu/Epicurus/menoec.html",
            "note": "Internet Classics Archive, free. The death passage."
          },
          {
            "title": "Death",
            "url": "https://plato.stanford.edu/entries/death/",
            "note": "Stanford Encyclopedia of Philosophy, free. The Epicurean argument and the deprivation account."
          }
        ]
      ],
      [
        "Lucretius: On the Nature of Things and the symmetry argument",
        [
          {
            "title": "Lucretius, On the Nature of Things, tr. W. E. Leonard (1916)",
            "url": "https://www.gutenberg.org/ebooks/785",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Lucretius",
            "url": "https://plato.stanford.edu/entries/lucretius/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Lucretius",
            "url": "https://iep.utm.edu/lucretiu/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "The early Stoics: Zeno, Cleanthes and Chrysippus",
        [
          {
            "title": "Stoicism",
            "url": "https://plato.stanford.edu/entries/stoicism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Chrysippus",
            "url": "https://iep.utm.edu/chrysippus/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Diogenes Laertius, Lives and Opinions of Eminent Philosophers, tr. C. D. Yonge (1853)",
            "url": "https://www.gutenberg.org/ebooks/57342",
            "note": "Public domain, Project Gutenberg. The ancient source for most of the anecdotes."
          }
        ]
      ],
      [
        "Stoic logic and knowledge: propositions and the cataleptic impression",
        [
          {
            "title": "Ancient Logic",
            "url": "https://plato.stanford.edu/entries/logic-ancient/",
            "note": "Stanford Encyclopedia of Philosophy, free. Has a full section on Stoic logic."
          },
          {
            "title": "Stoic Philosophy of Mind",
            "url": "https://iep.utm.edu/stoicmind/",
            "note": "Internet Encyclopedia of Philosophy, free. Impressions and assent."
          }
        ]
      ],
      [
        "Stoic physics: a living, rational cosmos",
        [
          {
            "title": "Stoicism",
            "url": "https://iep.utm.edu/stoicism/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Stoicism",
            "url": "https://plato.stanford.edu/entries/stoicism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Stoic ethics: virtue the only good, and the passions as false judgements",
        [
          {
            "title": "Stoicism",
            "url": "https://plato.stanford.edu/entries/stoicism/",
            "note": "Stanford Encyclopedia of Philosophy, free. Ethics and the passions."
          },
          {
            "title": "Cicero, Academic Questions, On Ends and Tusculan Disputations, tr. C. D. Yonge",
            "url": "https://www.gutenberg.org/ebooks/29247",
            "note": "Public domain, Project Gutenberg. On Ends 3 states Stoic ethics; book 4 attacks it."
          }
        ]
      ],
      [
        "Chrysippus on fate and freedom: the cylinder and the lazy argument",
        [
          {
            "title": "Chrysippus",
            "url": "https://iep.utm.edu/chrysippus/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Alexander of Aphrodisias",
            "url": "https://plato.stanford.edu/entries/alexander-aphrodisias/",
            "note": "Stanford Encyclopedia of Philosophy, free. Includes his reply on fate."
          }
        ]
      ],
      [
        "Pyrrho of Elis: suspension of judgement and tranquillity",
        [
          {
            "title": "Pyrrho",
            "url": "https://plato.stanford.edu/entries/pyrrho/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Timon of Phlius",
            "url": "https://plato.stanford.edu/entries/timon-phlius/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Sextus Empiricus: the modes and the Pyrrhonist way of life",
        [
          {
            "title": "Sextus Empiricus",
            "url": "https://plato.stanford.edu/entries/sextus-empiricus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Ancient Skepticism",
            "url": "https://plato.stanford.edu/entries/skepticism-ancient/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Ancient Greek Skepticism",
            "url": "https://iep.utm.edu/ancient-greek-skepticism/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "The Academic sceptics: Arcesilaus and Carneades against the Stoics",
        [
          {
            "title": "Arcesilaus",
            "url": "https://plato.stanford.edu/entries/arcesilaus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Carneades",
            "url": "https://plato.stanford.edu/entries/carneades/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Philo of Larissa",
            "url": "https://plato.stanford.edu/entries/philo-larissa/",
            "note": "Stanford Encyclopedia of Philosophy, free. The end of the sceptical Academy; see also the entry on Antiochus."
          }
        ]
      ],
      [
        "Cicero: Greek philosophy brought into Latin",
        [
          {
            "title": "Cicero",
            "url": "https://plato.stanford.edu/entries/cicero/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Cicero",
            "url": "https://iep.utm.edu/cicero/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Cicero, Academic Questions, On Ends and Tusculan Disputations, tr. C. D. Yonge",
            "url": "https://www.gutenberg.org/ebooks/29247",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Seneca: the letters, anger and the shortness of life",
        [
          {
            "title": "Seneca",
            "url": "https://plato.stanford.edu/entries/seneca/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Seneca, Moral Letters to Lucilius, tr. R. M. Gummere",
            "url": "https://en.wikisource.org/wiki/Moral_letters_to_Lucilius",
            "note": "Wikisource, free."
          },
          {
            "title": "Seneca, Minor Dialogues, tr. Aubrey Stewart",
            "url": "https://www.gutenberg.org/ebooks/64576",
            "note": "Public domain, Project Gutenberg. Includes On Anger and On the Shortness of Life."
          }
        ]
      ],
      [
        "Epictetus: the slave who taught freedom",
        [
          {
            "title": "Epictetus",
            "url": "https://plato.stanford.edu/entries/epictetus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Epictetus",
            "url": "https://iep.utm.edu/epictetu/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Epictetus, Discourses and Enchiridion, tr. George Long",
            "url": "https://www.gutenberg.org/ebooks/10661",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Reading: Epictetus, Enchiridion 1, on what is in our power",
        [
          {
            "title": "Epictetus, Discourses and Enchiridion, tr. George Long",
            "url": "https://www.gutenberg.org/ebooks/10661",
            "note": "Public domain, Project Gutenberg. The text read in this lesson."
          },
          {
            "title": "Epictetus, The Enchiridion, tr. T. W. Higginson",
            "url": "https://www.gutenberg.org/ebooks/45109",
            "note": "Public domain, Project Gutenberg. A second translation to compare."
          }
        ]
      ],
      [
        "Marcus Aurelius: the Meditations of an emperor",
        [
          {
            "title": "Marcus Aurelius, Thoughts, tr. George Long",
            "url": "https://www.gutenberg.org/ebooks/15877",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Marcus Aurelius",
            "url": "https://plato.stanford.edu/entries/marcus-aurelius/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Aurelius, Marcus",
            "url": "https://iep.utm.edu/marcus/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Hadot: ancient philosophy as a way of life",
        [
          {
            "title": "Hadot, Pierre",
            "url": "https://iep.utm.edu/hadot/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Pierre Hadot, Philosophy as a Way of Life (1995)",
            "note": "Printed book, ed. Arnold Davidson, tr. Michael Chase."
          }
        ]
      ],
      [
        "Middle Platonism and Philo of Alexandria",
        [
          {
            "title": "Philo of Alexandria",
            "url": "https://plato.stanford.edu/entries/philo/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Philo of Alexandria",
            "url": "https://iep.utm.edu/philo/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Antiochus of Ascalon",
            "url": "https://plato.stanford.edu/entries/antiochus-ascalon/",
            "note": "Stanford Encyclopedia of Philosophy, free. Where Middle Platonism begins."
          }
        ]
      ],
      [
        "Plotinus: the One, Intellect and Soul",
        [
          {
            "title": "Plotinus",
            "url": "https://plato.stanford.edu/entries/plotinus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Plotinus",
            "url": "https://iep.utm.edu/plotinus/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Plotinus, The Six Enneads, tr. Stephen MacKenna and B. S. Page",
            "url": "https://classics.mit.edu/Plotinus/enneads.html",
            "note": "Internet Classics Archive, free."
          }
        ]
      ],
      [
        "Plotinus on evil as privation and the ascent to the One",
        [
          {
            "title": "Plotinus",
            "url": "https://plato.stanford.edu/entries/plotinus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Neoplatonism",
            "url": "https://plato.stanford.edu/entries/neoplatonism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Plotinos: Complete Works, vol. 1, tr. K. S. Guthrie (1918)",
            "url": "https://www.gutenberg.org/ebooks/42930",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Porphyry, Iamblichus and Proclus: the later Neoplatonists",
        [
          {
            "title": "Porphyry",
            "url": "https://plato.stanford.edu/entries/porphyry/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Iamblichus",
            "url": "https://plato.stanford.edu/entries/iamblichus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Proclus",
            "url": "https://plato.stanford.edu/entries/proclus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Justinian and 529: the end of the Athenian school",
        [
          {
            "title": "Simplicius",
            "url": "https://plato.stanford.edu/entries/simplicius/",
            "note": "Stanford Encyclopedia of Philosophy, free. Includes the Persian journey and the Harran question."
          },
          {
            "title": "John Philoponus",
            "url": "https://plato.stanford.edu/entries/philoponus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Ammonius",
            "url": "https://plato.stanford.edu/entries/ammonius/",
            "note": "Stanford Encyclopedia of Philosophy, free. The Alexandrian school."
          }
        ]
      ],
      [
        "Looking back: the schools, the sceptics and the Platonic return",
        [
          {
            "title": "Neo-Platonism",
            "url": "https://iep.utm.edu/neoplat/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "Ancient Skepticism",
            "url": "https://plato.stanford.edu/entries/skepticism-ancient/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 6 · Late antiquity and the early Middle Ages",
    "lessons": [
      [
        "Context: philosophy in a world of three scriptures, 300–1200",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Medieval Philosophy",
            "url": "https://plato.stanford.edu/entries/medieval-philosophy/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Greek Sources in Arabic and Islamic Philosophy",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-greek/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Athens and Jerusalem: Justin, Clement, Origen and the Cappadocians",
        [
          {
            "title": "Justin Martyr, First Apology, ch. 46, tr. Dods and Reith (Ante-Nicene Fathers vol. 1)",
            "url": "https://ccel.org/ccel/schaff/anf01.viii.ii.xlvi.html",
            "note": "Public domain, Christian Classics Ethereal Library."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Origen",
            "url": "https://plato.stanford.edu/entries/origen/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Origen of Alexandria",
            "url": "https://iep.utm.edu/origen/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Augustine: the restless life behind the Confessions",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Augustine of Hippo",
            "url": "https://plato.stanford.edu/entries/augustine/",
            "note": "Free online."
          },
          {
            "title": "Augustine, Confessions, tr. E. B. Pusey (1838)",
            "url": "https://www.gutenberg.org/ebooks/3296",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Augustine: si fallor, sum, and the light of truth",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Divine Illumination",
            "url": "https://plato.stanford.edu/entries/illumination/",
            "note": "Free online."
          },
          {
            "title": "Augustine, The City of God, vol. 1 (Books I–XIII), tr. Marcus Dods and others (1871)",
            "url": "https://www.gutenberg.org/ebooks/45304",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Augustine",
            "url": "https://iep.utm.edu/augustin/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Augustine: evil is not a thing but a lack",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: The Problem of Evil",
            "url": "https://plato.stanford.edu/entries/evil/",
            "note": "Free online."
          },
          {
            "title": "Augustine, Confessions, tr. E. B. Pusey (1838)",
            "url": "https://www.gutenberg.org/ebooks/3296",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Augustine, The City of God, vol. 1 (Books I–XIII), tr. Marcus Dods and others (1871)",
            "url": "https://www.gutenberg.org/ebooks/45304",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Augustine: free choice of the will",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Augustine of Hippo",
            "url": "https://plato.stanford.edu/entries/augustine/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Foreknowledge and Free Will",
            "url": "https://plato.stanford.edu/entries/free-will-foreknowledge/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Reading: Augustine, Confessions XI, on what time is",
        [
          {
            "title": "Augustine, Confessions, tr. E. B. Pusey (1838)",
            "url": "https://www.gutenberg.org/ebooks/3296",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Augustine",
            "url": "https://iep.utm.edu/augustin/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Augustine: the City of God and the two cities",
        [
          {
            "title": "Augustine, The City of God, vol. 2 (Books XIV–XXII), tr. Marcus Dods and others (1871)",
            "url": "https://www.gutenberg.org/ebooks/45305",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Augustine, The City of God, vol. 1 (Books I–XIII), tr. Marcus Dods and others (1871)",
            "url": "https://www.gutenberg.org/ebooks/45304",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Augustine of Hippo",
            "url": "https://plato.stanford.edu/entries/augustine/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Boethius: the Consolation of Philosophy and the wheel of Fortune",
        [
          {
            "title": "Boethius, The Consolation of Philosophy, tr. H. R. James (1897)",
            "url": "https://www.gutenberg.org/ebooks/14328",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Anicius Manlius Severinus Boethius",
            "url": "https://plato.stanford.edu/entries/boethius/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Boethius",
            "url": "https://iep.utm.edu/boethius/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Boethius: God's foreknowledge and human freedom",
        [
          {
            "title": "Boethius, The Consolation of Philosophy, tr. H. R. James (1897)",
            "url": "https://www.gutenberg.org/ebooks/14328",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Eternity in Christian Thought",
            "url": "https://plato.stanford.edu/entries/eternity/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Foreknowledge and Free Will",
            "url": "https://iep.utm.edu/foreknow/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Boethius and Porphyry: the problem of universals",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: The Medieval Problem of Universals",
            "url": "https://plato.stanford.edu/entries/universals-medieval/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Porphyry",
            "url": "https://plato.stanford.edu/entries/porphyry/",
            "note": "Free online."
          }
        ]
      ],
      [
        "John Philoponus: the world had a beginning",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: John Philoponus",
            "url": "https://plato.stanford.edu/entries/philoponus/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Pseudo-Dionysius: negative theology as philosophy",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Pseudo-Dionysius the Areopagite",
            "url": "https://plato.stanford.edu/entries/pseudo-dionysius-areopagite/",
            "note": "Free online."
          },
          {
            "title": "Dionysius the Areopagite, On the Divine Names and the Mystical Theology, tr. C. E. Rolt (1920)",
            "url": "https://ccel.org/ccel/rolt/dionysius",
            "note": "Public domain, Christian Classics Ethereal Library."
          }
        ]
      ],
      [
        "Maximus the Confessor: the natural will and the deliberating will",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Byzantine Philosophy",
            "url": "https://plato.stanford.edu/entries/byzantine-philosophy/",
            "note": "Free online."
          },
          {
            "title": "Michael Frede, A Free Will: Origins of the Notion in Ancient Thought (2011)",
            "note": "Printed book by Michael Frede; argues about where the idea of will begins."
          }
        ]
      ],
      [
        "Eriugena: the Periphyseon and the division of nature",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: John Scottus Eriugena",
            "url": "https://plato.stanford.edu/entries/scottus-eriugena/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Anselm: the ontological argument of the Proslogion",
        [
          {
            "title": "Anselm, Proslogium; Monologium; Gaunilo's In Behalf of the Fool; Cur Deus Homo, tr. S. N. Deane (1903)",
            "url": "https://ccel.org/ccel/anselm/basic_works",
            "note": "Public domain, Christian Classics Ethereal Library."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Ontological Arguments",
            "url": "https://plato.stanford.edu/entries/ontological-arguments/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Anselm: Ontological Argument for God's Existence",
            "url": "https://iep.utm.edu/ont-arg/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Gaunilo's lost island and Anselm's reply",
        [
          {
            "title": "Anselm, Proslogium; Monologium; Gaunilo's In Behalf of the Fool; Cur Deus Homo, tr. S. N. Deane (1903)",
            "url": "https://ccel.org/ccel/anselm/basic_works",
            "note": "Public domain, Christian Classics Ethereal Library."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Anselm of Canterbury",
            "url": "https://plato.stanford.edu/entries/anselm/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Anselm",
            "url": "https://iep.utm.edu/anselm/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Falsafa: Greek philosophy goes into Arabic",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Greek Sources in Arabic and Islamic Philosophy",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-greek/",
            "note": "Free online."
          },
          {
            "title": "Dimitri Gutas, Greek Thought, Arabic Culture (1998)",
            "note": "Printed book by Dimitri Gutas on the translation movement."
          }
        ]
      ],
      [
        "Al-Kindi: the first philosopher of the Arabs",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Al-Kindi",
            "url": "https://plato.stanford.edu/entries/al-kindi/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Al-Farabi: the Second Teacher and the virtuous city",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Al-Farabi",
            "url": "https://plato.stanford.edu/entries/al-farabi/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Arabic and Islamic Philosophy of Language and Logic",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-language/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Avicenna: essence, existence and the necessary existent",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Ibn Sina's Metaphysics",
            "url": "https://plato.stanford.edu/entries/ibn-sina-metaphysics/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Ibn Sina [Avicenna]",
            "url": "https://plato.stanford.edu/entries/ibn-sina/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Avicenna (Ibn Sina)",
            "url": "https://iep.utm.edu/avicenna/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Avicenna: the flying man",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Arabic and Islamic Psychology and Philosophy of Mind",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-mind/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Avicenna (Ibn Sina)",
            "url": "https://iep.utm.edu/avicenna/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Al-Ghazali: the Incoherence of the Philosophers",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Al-Ghazali",
            "url": "https://plato.stanford.edu/entries/al-ghazali/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Arabic and Islamic Natural Philosophy and Natural Science",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-natural/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Al-Ghazali",
            "url": "https://iep.utm.edu/al-ghazali/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Averroes: the Incoherence of the Incoherence and the Commentator",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Ibn Rushd [Averroes]",
            "url": "https://plato.stanford.edu/entries/ibn-rushd/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Ibn Rushd (Averroes)",
            "url": "https://iep.utm.edu/ibn-rushd/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Saadia Gaon: reason and revelation in Jewish philosophy",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Saadya [Saadiah]",
            "url": "https://plato.stanford.edu/entries/saadya/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Maimonides: the Guide of the Perplexed and negative attributes",
        [
          {
            "title": "Maimonides, The Guide for the Perplexed, tr. M. Friedländer (1910 printing)",
            "url": "https://www.gutenberg.org/ebooks/73584",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Maimonides",
            "url": "https://plato.stanford.edu/entries/maimonides/",
            "note": "Free online."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Maimonides",
            "url": "https://iep.utm.edu/maimonid/",
            "note": "Free online."
          }
        ]
      ],
      [
        "The road into Latin Europe: Toledo, the translators and the Arab Aristotle",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Influence of Arabic and Islamic Philosophy on the Latin West",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-influence/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Medieval Philosophy",
            "url": "https://plato.stanford.edu/entries/medieval-philosophy/",
            "note": "Free online."
          }
        ]
      ],
      [
        "Looking back: what late antiquity and the early Middle Ages settled and left open",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Medieval Philosophy",
            "url": "https://plato.stanford.edu/entries/medieval-philosophy/",
            "note": "Free online."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Arabic and Islamic Metaphysics",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-metaphysics/",
            "note": "Free online."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 7 · The schoolmen",
    "lessons": [
      [
        "Context: cathedral schools, universities and the return of Aristotle",
        [
          {
            "title": "SEP: Medieval Philosophy",
            "url": "https://plato.stanford.edu/entries/medieval-philosophy/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Influence of Arabic and Islamic Philosophy on the Latin West",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-influence/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "The problem of universals: realism, nominalism and the question in between",
        [
          {
            "title": "SEP: The Medieval Problem of Universals",
            "url": "https://plato.stanford.edu/entries/universals-medieval/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Porphyry",
            "url": "https://plato.stanford.edu/entries/porphyry/",
            "note": "SEP, free. On the Isagoge and its three questions."
          }
        ]
      ],
      [
        "Roscelin, William of Champeaux and Abelard on universals",
        [
          {
            "title": "SEP: William of Champeaux",
            "url": "https://plato.stanford.edu/entries/william-champeaux/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Peter Abelard",
            "url": "https://plato.stanford.edu/entries/abelard/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: The Medieval Problem of Universals",
            "url": "https://plato.stanford.edu/entries/universals-medieval/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Abelard: the ethics of intention",
        [
          {
            "title": "IEP: Peter Abelard",
            "url": "https://iep.utm.edu/abelard/",
            "note": "Internet Encyclopedia of Philosophy, free. Covers the ethics of consent."
          },
          {
            "title": "SEP: Peter Abelard",
            "url": "https://plato.stanford.edu/entries/abelard/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Moral Luck",
            "url": "https://plato.stanford.edu/entries/moral-luck/",
            "note": "SEP, free. The modern debate Abelard anticipates."
          }
        ]
      ],
      [
        "Peter Lombard's Sentences and the scholastic method: the quaestio",
        [
          {
            "title": "SEP: Literary Forms of Medieval Philosophy",
            "url": "https://plato.stanford.edu/entries/medieval-literary/",
            "note": "SEP, free. The lectio, disputatio, quaestio and Sentences commentary."
          },
          {
            "title": "Catholic Encyclopedia (1911): Peter Lombard",
            "url": "https://www.newadvent.org/cathen/11768d.htm",
            "note": "Public domain, on New Advent. Old but useful on the Sentences."
          }
        ]
      ],
      [
        "The recovery of Aristotle and the condemnations of 1210 to 1277",
        [
          {
            "title": "SEP: Condemnation of 1277",
            "url": "https://plato.stanford.edu/entries/condemnation/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Robert Kilwardby",
            "url": "https://plato.stanford.edu/entries/robert-kilwardby/",
            "note": "SEP, free. Includes the Oxford prohibition of 1277."
          }
        ]
      ],
      [
        "Bonaventure: illumination, and why the world cannot be eternal",
        [
          {
            "title": "SEP: Bonaventure",
            "url": "https://plato.stanford.edu/entries/bonaventure/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Divine Illumination",
            "url": "https://plato.stanford.edu/entries/illumination/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Albert the Great: Aristotle for the Latins, and the study of nature",
        [
          {
            "title": "SEP: Albert the Great",
            "url": "https://plato.stanford.edu/entries/albert-great/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Aquinas: faith, reason, and what each can show",
        [
          {
            "title": "SEP: Thomas Aquinas",
            "url": "https://plato.stanford.edu/entries/aquinas/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: Thomas Aquinas",
            "url": "https://iep.utm.edu/aquinas/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Aquinas: essence and existence",
        [
          {
            "title": "SEP: Thomas Aquinas",
            "url": "https://plato.stanford.edu/entries/aquinas/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Existence",
            "url": "https://plato.stanford.edu/entries/existence/",
            "note": "SEP, free. Whether existence is a property: Kant, Frege and after."
          },
          {
            "title": "Anthony Kenny, Aquinas on Being (2002)",
            "note": "Printed book by Anthony Kenny: a critical reading of Aquinas on esse."
          }
        ]
      ],
      [
        "Aquinas: the Five Ways set out",
        [
          {
            "title": "SEP: Cosmological Argument",
            "url": "https://plato.stanford.edu/entries/cosmological-argument/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Anthony Kenny, The Five Ways (1969)",
            "note": "Printed book by Anthony Kenny: the classic critique."
          },
          {
            "title": "Edward Feser, Aquinas (2009)",
            "note": "Printed book by Edward Feser: a modern defence of the Five Ways."
          }
        ]
      ],
      [
        "Reading: Aquinas, the Five Ways (Summa theologiae I, q. 2, a. 3)",
        [
          {
            "title": "Summa Theologiae I, q. 2: The existence of God (New Advent)",
            "url": "https://www.newadvent.org/summa/1002.htm",
            "note": "Fathers of the English Dominican Province translation, 2nd revised edition (1920). Public domain, on New Advent. The text quoted in this lesson."
          },
          {
            "title": "Summa Theologica, Part I (Prima Pars), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/17611",
            "note": "The same 1920 English Dominican translation. Public domain."
          }
        ]
      ],
      [
        "Aquinas on analogy: how human words can speak of God",
        [
          {
            "title": "SEP: Medieval Theories of Analogy",
            "url": "https://plato.stanford.edu/entries/analogy-medieval/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Summa Theologiae I, q. 13: The names of God (New Advent)",
            "url": "https://www.newadvent.org/summa/1013.htm",
            "note": "Fathers of the English Dominican Province translation, 2nd revised edition (1920). Public domain, on New Advent."
          }
        ]
      ],
      [
        "Aquinas: the soul as the form of the body",
        [
          {
            "title": "Summa Theologiae I, q. 76: The union of body and soul (New Advent)",
            "url": "https://www.newadvent.org/summa/1076.htm",
            "note": "Fathers of the English Dominican Province translation, 2nd revised edition (1920). Public domain, on New Advent."
          },
          {
            "title": "SEP: Form vs. Matter",
            "url": "https://plato.stanford.edu/entries/form-matter/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Thomas Aquinas",
            "url": "https://plato.stanford.edu/entries/aquinas/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Aquinas: natural law and the virtues",
        [
          {
            "title": "SEP: Aquinas' Moral, Political, and Legal Philosophy",
            "url": "https://plato.stanford.edu/entries/aquinas-moral-political/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: The Natural Law Tradition in Ethics",
            "url": "https://plato.stanford.edu/entries/natural-law-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Summa Theologiae I-II, q. 94: The natural law (New Advent)",
            "url": "https://www.newadvent.org/summa/2094.htm",
            "note": "Fathers of the English Dominican Province translation, 2nd revised edition (1920). Public domain, on New Advent."
          }
        ]
      ],
      [
        "Siger of Brabant and the Latin Averroists",
        [
          {
            "title": "SEP: Condemnation of 1277",
            "url": "https://plato.stanford.edu/entries/condemnation/",
            "note": "SEP, free. Siger, the radical Aristotelians and the double-truth charge."
          },
          {
            "title": "SEP: Boethius of Dacia",
            "url": "https://plato.stanford.edu/entries/boethius-dacia/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Ibn Rushd [Averroes]",
            "url": "https://plato.stanford.edu/entries/ibn-rushd/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Duns Scotus: the univocity of being and the formal distinction",
        [
          {
            "title": "SEP: John Duns Scotus",
            "url": "https://plato.stanford.edu/entries/duns-scotus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: John Duns Scotus",
            "url": "https://iep.utm.edu/scotus/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Duns Scotus: haecceity, and the will that is free",
        [
          {
            "title": "SEP: Medieval Theories of Haecceity",
            "url": "https://plato.stanford.edu/entries/medieval-haecceity/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: John Duns Scotus",
            "url": "https://plato.stanford.edu/entries/duns-scotus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Ockham: the razor and nominalism",
        [
          {
            "title": "SEP: William of Ockham",
            "url": "https://plato.stanford.edu/entries/ockham/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: William of Ockham",
            "url": "https://iep.utm.edu/ockham/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Nominalism in Metaphysics",
            "url": "https://plato.stanford.edu/entries/nominalism-metaphysics/",
            "note": "SEP, free. The modern debate."
          }
        ]
      ],
      [
        "Ockham: God's absolute and ordained power",
        [
          {
            "title": "SEP: William of Ockham",
            "url": "https://plato.stanford.edu/entries/ockham/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Medieval Skepticism",
            "url": "https://plato.stanford.edu/entries/skepticism-medieval/",
            "note": "SEP, free. Intuitive cognition of non-existents and its aftermath."
          },
          {
            "title": "SEP: Theological Voluntarism",
            "url": "https://plato.stanford.edu/entries/voluntarism-theological/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "John Buridan: the via moderna in the arts faculty",
        [
          {
            "title": "SEP: John Buridan",
            "url": "https://plato.stanford.edu/entries/buridan/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Medieval Theories: Properties of Terms",
            "url": "https://plato.stanford.edu/entries/medieval-terms/",
            "note": "SEP, free. Supposition theory."
          },
          {
            "title": "SEP: Insolubles",
            "url": "https://plato.stanford.edu/entries/insolubles/",
            "note": "SEP, free. Medieval solutions to the liar."
          }
        ]
      ],
      [
        "Byzantine philosophy: Photios, Psellos and John Italos",
        [
          {
            "title": "SEP: Byzantine Philosophy",
            "url": "https://plato.stanford.edu/entries/byzantine-philosophy/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: John Italos",
            "url": "https://plato.stanford.edu/entries/john-italos/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Palamas and Barlaam: the hesychast controversy and the essence–energies distinction",
        [
          {
            "title": "SEP: Byzantine Philosophy",
            "url": "https://plato.stanford.edu/entries/byzantine-philosophy/",
            "note": "SEP, free. Includes Palamas and Barlaam."
          },
          {
            "title": "SEP: Divine Simplicity",
            "url": "https://plato.stanford.edu/entries/divine-simplicity/",
            "note": "SEP, free. The philosophical issue at stake."
          },
          {
            "title": "Catholic Encyclopedia (1910): Hesychasm",
            "url": "https://www.newadvent.org/cathen/07301a.htm",
            "note": "Public domain, on New Advent. A Latin, hostile account of its time; read for the history."
          }
        ]
      ],
      [
        "Nicholas of Cusa: learned ignorance and the coincidence of opposites",
        [
          {
            "title": "SEP: Cusanus, Nicolaus [Nicolas of Cusa]",
            "url": "https://plato.stanford.edu/entries/cusanus/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Looking back: the via antiqua, the via moderna, and what the Renaissance inherited",
        [
          {
            "title": "SEP: Medieval Philosophy",
            "url": "https://plato.stanford.edu/entries/medieval-philosophy/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: The Medieval Problem of Universals",
            "url": "https://plato.stanford.edu/entries/universals-medieval/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 8 · From the Renaissance to the rationalists",
    "lessons": [
      [
        "Context: Europe from the Renaissance to the age of Newton",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Scientific Revolutions",
            "url": "https://plato.stanford.edu/entries/scientific-revolutions/",
            "note": "Free. What changed in the sciences, and how historians now describe it."
          },
          {
            "title": "Early Modern Texts (Jonathan Bennett)",
            "url": "https://www.earlymoderntexts.com/",
            "note": "Free modernised versions of the main texts of this stage, Descartes to Leibniz."
          }
        ]
      ],
      [
        "Humanism and the revival of Plato: Ficino and Pico",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Marsilio Ficino",
            "url": "https://plato.stanford.edu/entries/ficino/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Giovanni Pico della Mirandola",
            "url": "https://plato.stanford.edu/entries/pico-della-mirandola/",
            "note": "Free. The 900 theses and the Oration."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Marsilio Ficino",
            "url": "https://iep.utm.edu/ficino/",
            "note": "Free."
          }
        ]
      ],
      [
        "Machiavelli: The Prince and the effectual truth",
        [
          {
            "title": "Machiavelli, The Prince, tr. W. K. Marriott",
            "url": "https://www.gutenberg.org/ebooks/1232",
            "note": "Public domain, Project Gutenberg. The source of this lesson's quotation."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Niccolò Machiavelli",
            "url": "https://plato.stanford.edu/entries/machiavelli/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Machiavelli",
            "url": "https://earlymoderntexts.com/authors/machiavelli",
            "note": "Free modernised version of The Prince."
          }
        ]
      ],
      [
        "Montaigne and the new scepticism",
        [
          {
            "title": "Montaigne, Essays, tr. Charles Cotton, ed. W. C. Hazlitt (1877)",
            "url": "https://www.gutenberg.org/ebooks/3600",
            "note": "Public domain, Project Gutenberg. Includes the Apology for Raymond Sebond (II.12)."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Michel de Montaigne",
            "url": "https://plato.stanford.edu/entries/montaigne/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Montaigne",
            "url": "https://earlymoderntexts.com/authors/montaigne",
            "note": "Free modernised version of the Essays."
          }
        ]
      ],
      [
        "Bacon: the idols and the new induction",
        [
          {
            "title": "Bacon, Novum Organum, ed. Joseph Devey (1902)",
            "url": "https://www.gutenberg.org/ebooks/45988",
            "note": "Public domain, Project Gutenberg. The idols are aphorisms I.38–68."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Francis Bacon",
            "url": "https://plato.stanford.edu/entries/francis-bacon/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Bacon",
            "url": "https://earlymoderntexts.com/authors/bacon",
            "note": "Free modernised version of the New Organon."
          }
        ]
      ],
      [
        "The scientific revolution's challenge to Aristotle",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Galileo Galilei",
            "url": "https://plato.stanford.edu/entries/galileo/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Robert Boyle",
            "url": "https://plato.stanford.edu/entries/boyle/",
            "note": "Free. The mechanical philosophy and primary and secondary qualities."
          }
        ]
      ],
      [
        "Descartes: the method of doubt and the evil demon",
        [
          {
            "title": "Descartes, Meditations on First Philosophy, tr. John Veitch (Wikisource)",
            "url": "https://en.wikisource.org/wiki/Meditations_on_First_Philosophy/Meditation_I",
            "note": "Public domain. Meditation I, the source of this lesson's quotation."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Descartes' Epistemology",
            "url": "https://plato.stanford.edu/entries/descartes-epistemology/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Descartes",
            "url": "https://earlymoderntexts.com/authors/descartes",
            "note": "Free modernised Meditations, with the Objections and Replies."
          }
        ]
      ],
      [
        "Descartes: the cogito and the thinking thing",
        [
          {
            "title": "Descartes, Discourse on the Method, tr. John Veitch",
            "url": "https://www.gutenberg.org/ebooks/59",
            "note": "Public domain, Project Gutenberg. Part IV has \"I think, therefore I am\"."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: René Descartes",
            "url": "https://plato.stanford.edu/entries/descartes/",
            "note": "Free."
          }
        ]
      ],
      [
        "Reading: Descartes's Meditation II, the cogito and the wax",
        [
          {
            "title": "Descartes, Meditation II, tr. John Veitch (1853; reprinted 1901), Wikisource",
            "url": "https://en.wikisource.org/wiki/Meditations_on_First_Philosophy/Meditation_II",
            "note": "Public domain. The text read in this lesson."
          },
          {
            "title": "Early Modern Texts: Descartes",
            "url": "https://earlymoderntexts.com/authors/descartes",
            "note": "Free modernised version by Jonathan Bennett, for comparison."
          }
        ]
      ],
      [
        "Descartes: the trademark argument for God",
        [
          {
            "title": "Descartes, Meditation III, tr. John Veitch (Wikisource)",
            "url": "https://en.wikisource.org/wiki/Meditations_on_First_Philosophy/Meditation_III",
            "note": "Public domain."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Descartes' Theory of Ideas",
            "url": "https://plato.stanford.edu/entries/descartes-ideas/",
            "note": "Free. Formal and objective reality."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: René Descartes",
            "url": "https://iep.utm.edu/descarte/",
            "note": "Free."
          }
        ]
      ],
      [
        "Descartes: the ontological argument",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Descartes' Ontological Argument",
            "url": "https://plato.stanford.edu/entries/descartes-ontological/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Ontological Arguments",
            "url": "https://plato.stanford.edu/entries/ontological-arguments/",
            "note": "Free. Anselm to Plantinga."
          },
          {
            "title": "Descartes, Meditation V, tr. John Veitch (Wikisource)",
            "url": "https://en.wikisource.org/wiki/Meditations_on_First_Philosophy/Meditation_V",
            "note": "Public domain. The source of this lesson's quotation."
          }
        ]
      ],
      [
        "Descartes: the Cartesian circle",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Descartes' Epistemology",
            "url": "https://plato.stanford.edu/entries/descartes-epistemology/",
            "note": "Free. Includes the circle and the main readings."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Antoine Arnauld",
            "url": "https://plato.stanford.edu/entries/arnauld/",
            "note": "Free."
          }
        ]
      ],
      [
        "Descartes: mind-body dualism and the real distinction",
        [
          {
            "title": "Descartes, Meditation VI, tr. John Veitch (Wikisource)",
            "url": "https://en.wikisource.org/wiki/Meditations_on_First_Philosophy/Meditation_VI",
            "note": "Public domain. The source of this lesson's quotations."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Descartes, Mind-Body Distinction",
            "url": "https://iep.utm.edu/descmind/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Dualism",
            "url": "https://plato.stanford.edu/entries/dualism/",
            "note": "Free."
          }
        ]
      ],
      [
        "Descartes: the pineal gland and Elisabeth of Bohemia's objection",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Elisabeth, Princess of Bohemia",
            "url": "https://plato.stanford.edu/entries/elisabeth-bohemia/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Descartes",
            "url": "https://earlymoderntexts.com/authors/descartes",
            "note": "Free modernised Correspondence with Princess Elisabeth, and The Passions of the Soul."
          }
        ]
      ],
      [
        "Gassendi, Arnauld and the Objections and Replies",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Pierre Gassendi",
            "url": "https://plato.stanford.edu/entries/gassendi/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Marin Mersenne",
            "url": "https://plato.stanford.edu/entries/mersenne/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Descartes",
            "url": "https://earlymoderntexts.com/authors/descartes",
            "note": "Free modernised Objections and Replies."
          }
        ]
      ],
      [
        "Hobbes: materialism and the mechanical mind",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Thomas Hobbes",
            "url": "https://plato.stanford.edu/entries/hobbes/",
            "note": "Free."
          },
          {
            "title": "Hobbes, Leviathan (1651)",
            "url": "https://www.gutenberg.org/ebooks/3207",
            "note": "Public domain, Project Gutenberg, original spelling. Chapters 1–6 on sense, imagination and reason."
          },
          {
            "title": "Early Modern Texts: Hobbes",
            "url": "https://earlymoderntexts.com/authors/hobbes",
            "note": "Free modernised Leviathan."
          }
        ]
      ],
      [
        "Hobbes: the state of nature, the social contract and the Leviathan",
        [
          {
            "title": "Hobbes, Leviathan (1651)",
            "url": "https://www.gutenberg.org/ebooks/3207",
            "note": "Public domain, Project Gutenberg. Chapters 13–17; the source of this lesson's quotations."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Hobbes's Moral and Political Philosophy",
            "url": "https://plato.stanford.edu/entries/hobbes-moral/",
            "note": "Free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Hobbes, Moral and Political Philosophy",
            "url": "https://iep.utm.edu/hobmoral/",
            "note": "Free."
          }
        ]
      ],
      [
        "Pascal: the wager",
        [
          {
            "title": "Pascal, Pensées, tr. W. F. Trotter (Dutton edition)",
            "url": "https://www.gutenberg.org/ebooks/18269",
            "note": "Project Gutenberg. The wager is fragment 233."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Pascal's Wager",
            "url": "https://plato.stanford.edu/entries/pascal-wager/",
            "note": "Free. The versions of the argument and the objections."
          }
        ]
      ],
      [
        "Pascal: the Pensées and the reasons of the heart",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Blaise Pascal",
            "url": "https://plato.stanford.edu/entries/pascal/",
            "note": "Free."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Blaise Pascal",
            "url": "https://iep.utm.edu/pascal-b/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Pascal",
            "url": "https://earlymoderntexts.com/authors/pascal",
            "note": "Free modernised Pensées."
          }
        ]
      ],
      [
        "Spinoza: substance monism and Deus sive Natura",
        [
          {
            "title": "Spinoza, Ethics, tr. R. H. M. Elwes",
            "url": "https://www.gutenberg.org/ebooks/3800",
            "note": "Public domain, Project Gutenberg. The source of this lesson's quotations."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Baruch Spinoza",
            "url": "https://plato.stanford.edu/entries/spinoza/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Spinoza",
            "url": "https://earlymoderntexts.com/authors/spinoza",
            "note": "Free modernised Ethics."
          }
        ]
      ],
      [
        "Spinoza: the geometric method, determinism and the conatus",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Spinoza's Modal Metaphysics",
            "url": "https://plato.stanford.edu/entries/spinoza-modal/",
            "note": "Free. Necessitarianism."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Spinoza's Psychological Theory",
            "url": "https://plato.stanford.edu/entries/spinoza-psychological/",
            "note": "Free. The conatus and the affects."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Benedict de Spinoza",
            "url": "https://iep.utm.edu/spinoza/",
            "note": "Free."
          }
        ]
      ],
      [
        "Spinoza: the Tractatus Theologico-Politicus and the freedom to philosophise",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Spinoza's Political Philosophy",
            "url": "https://plato.stanford.edu/entries/spinoza-political/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Spinoza",
            "url": "https://earlymoderntexts.com/authors/spinoza",
            "note": "Free modernised Theological-Political Treatise."
          }
        ]
      ],
      [
        "Malebranche and occasionalism",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Nicolas Malebranche",
            "url": "https://plato.stanford.edu/entries/malebranche/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Occasionalism",
            "url": "https://plato.stanford.edu/entries/occasionalism/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Malebranche",
            "url": "https://earlymoderntexts.com/authors/malebranche",
            "note": "Free modernised texts."
          }
        ]
      ],
      [
        "Leibniz: monads and pre-established harmony",
        [
          {
            "title": "Leibniz, Monadology, tr. Robert Latta (1898), Wikisource",
            "url": "https://en.wikisource.org/wiki/Monadology_(Leibniz,_tr._Latta)",
            "note": "Public domain. The source of this lesson's quotations."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Leibniz's Philosophy of Mind",
            "url": "https://plato.stanford.edu/entries/leibniz-mind/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Leibniz",
            "url": "https://earlymoderntexts.com/authors/leibniz",
            "note": "Free modernised Monadology, New System and Discourse."
          }
        ]
      ],
      [
        "Leibniz: the principle of sufficient reason and the identity of indiscernibles",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Principle of Sufficient Reason",
            "url": "https://plato.stanford.edu/entries/sufficient-reason/",
            "note": "Free."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: The Identity of Indiscernibles",
            "url": "https://plato.stanford.edu/entries/identity-indiscernible/",
            "note": "Free. Includes Black's spheres."
          },
          {
            "title": "Internet Encyclopedia of Philosophy: Leibniz, Metaphysics",
            "url": "https://iep.utm.edu/leib-met/",
            "note": "Free."
          }
        ]
      ],
      [
        "Leibniz: the best of all possible worlds and the Theodicy",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Leibniz on the Problem of Evil",
            "url": "https://plato.stanford.edu/entries/leibniz-evil/",
            "note": "Free."
          },
          {
            "title": "Leibniz, Theodicy, tr. E. M. Huggard",
            "url": "https://www.gutenberg.org/ebooks/17147",
            "note": "Project Gutenberg. Further reading; not quoted in this lesson."
          }
        ]
      ],
      [
        "Leibniz and Clarke: space, God and the clockwork universe",
        [
          {
            "title": "Early Modern Texts: Samuel Clarke",
            "url": "https://earlymoderntexts.com/authors/clarke",
            "note": "Free modernised Leibniz–Clarke correspondence."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Absolute and Relational Space and Motion: Classical Theories",
            "url": "https://plato.stanford.edu/entries/spacetime-theories-classical/",
            "note": "Free. Newton, Leibniz and the bucket."
          }
        ]
      ],
      [
        "Anne Conway: one substance, alive throughout",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Lady Anne Conway",
            "url": "https://plato.stanford.edu/entries/conway/",
            "note": "Free."
          },
          {
            "title": "Early Modern Texts: Conway",
            "url": "https://earlymoderntexts.com/authors/conway",
            "note": "Free modernised Principles of the Most Ancient and Modern Philosophy."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: The Cambridge Platonists",
            "url": "https://plato.stanford.edu/entries/cambridge-platonists/",
            "note": "Free. Henry More and his circle."
          }
        ]
      ],
      [
        "Looking back: from Renaissance doubt to rationalist systems",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Gottfried Wilhelm Leibniz",
            "url": "https://plato.stanford.edu/entries/leibniz/",
            "note": "Free. A good point to survey the rationalist achievement."
          },
          {
            "title": "Early Modern Texts (Jonathan Bennett)",
            "url": "https://www.earlymoderntexts.com/",
            "note": "Free. Continue to Locke, Berkeley and Hume for Stage 9."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 9 · The empiricists and the Enlightenment",
    "lessons": [
      [
        "Context: the new science, a bloodless revolution and the republic of letters",
        [
          {
            "title": "Enlightenment (Stanford Encyclopedia of Philosophy)",
            "url": "https://plato.stanford.edu/entries/enlightenment/",
            "note": "Free. The movement as a whole: science, religion, ethics, politics."
          },
          {
            "title": "Scottish Philosophy in the 18th Century (SEP)",
            "url": "https://plato.stanford.edu/entries/scottish-18th/",
            "note": "Free. Hutcheson, Hume, Smith, Reid and their setting."
          }
        ]
      ],
      [
        "Locke: the attack on innate ideas",
        [
          {
            "title": "John Locke (SEP)",
            "url": "https://plato.stanford.edu/entries/locke/",
            "note": "Free. Life and the Essay."
          },
          {
            "title": "The Historical Controversies Surrounding Innateness (SEP)",
            "url": "https://plato.stanford.edu/entries/innateness-history/",
            "note": "Free. Locke, Leibniz and the later debate."
          },
          {
            "title": "Locke, Essay Concerning Human Understanding, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/locke",
            "note": "Free. Early Modern Texts: Book I is the attack on innate ideas."
          }
        ]
      ],
      [
        "Locke: simple and complex ideas, and where knowledge stops",
        [
          {
            "title": "John Locke (SEP)",
            "url": "https://plato.stanford.edu/entries/locke/",
            "note": "Free. Ideas, knowledge, essences."
          },
          {
            "title": "Locke, Essay Concerning Human Understanding, vol. 1 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10615",
            "note": "Public domain. Book II, on ideas."
          },
          {
            "title": "Locke, John (Internet Encyclopedia of Philosophy)",
            "url": "https://iep.utm.edu/locke/",
            "note": "Free."
          }
        ]
      ],
      [
        "Locke: primary and secondary qualities, and substance",
        [
          {
            "title": "John Locke (SEP)",
            "url": "https://plato.stanford.edu/entries/locke/",
            "note": "Free. Primary and secondary qualities; substance."
          },
          {
            "title": "Substance (SEP)",
            "url": "https://plato.stanford.edu/entries/substance/",
            "note": "Free. Includes Locke's substratum."
          },
          {
            "title": "Locke, Essay, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/locke",
            "note": "Free. Book II, chapters viii and xxiii."
          }
        ]
      ],
      [
        "Locke: personal identity and memory",
        [
          {
            "title": "Locke on Personal Identity (SEP)",
            "url": "https://plato.stanford.edu/entries/locke-personal-identity/",
            "note": "Free."
          },
          {
            "title": "Personal Identity (SEP)",
            "url": "https://plato.stanford.edu/entries/identity-personal/",
            "note": "Free. The later debate: psychological continuity, Parfit."
          }
        ]
      ],
      [
        "Molyneux's problem: would the newly sighted know the cube?",
        [
          {
            "title": "Molyneux's Problem (SEP)",
            "url": "https://plato.stanford.edu/entries/molyneux-problem/",
            "note": "Free. Includes the modern experiments."
          },
          {
            "title": "Molyneux's Question (IEP)",
            "url": "https://iep.utm.edu/molyneux/",
            "note": "Free."
          },
          {
            "title": "Locke, Essay Concerning Human Understanding, vol. 1 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10615",
            "note": "Public domain. Book II, chapter ix, section 8."
          }
        ]
      ],
      [
        "Locke: the Two Treatises, property and toleration",
        [
          {
            "title": "Locke's Political Philosophy (SEP)",
            "url": "https://plato.stanford.edu/entries/locke-political/",
            "note": "Free."
          },
          {
            "title": "Locke, Second Treatise of Government (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/7370",
            "note": "Public domain."
          },
          {
            "title": "Locke, Second Treatise and Letter on Toleration, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/locke",
            "note": "Free. Early Modern Texts."
          }
        ]
      ],
      [
        "Berkeley: immaterialism and esse est percipi",
        [
          {
            "title": "George Berkeley (SEP)",
            "url": "https://plato.stanford.edu/entries/berkeley/",
            "note": "Free."
          },
          {
            "title": "Berkeley, A Treatise Concerning the Principles of Human Knowledge (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/4723",
            "note": "Public domain. Sections 1–33 hold the core arguments."
          },
          {
            "title": "Berkeley, Principles and Three Dialogues, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/berkeley",
            "note": "Free. Early Modern Texts."
          }
        ]
      ],
      [
        "Berkeley: the master argument and God as perceiver",
        [
          {
            "title": "George Berkeley (SEP)",
            "url": "https://plato.stanford.edu/entries/berkeley/",
            "note": "Free. The master argument and the arguments for God."
          },
          {
            "title": "Berkeley, Three Dialogues between Hylas and Philonous (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/4724",
            "note": "Public domain."
          },
          {
            "title": "Berkeley, George (IEP)",
            "url": "https://iep.utm.edu/berkeley/",
            "note": "Free."
          }
        ]
      ],
      [
        "Hume: impressions, ideas and the copy principle",
        [
          {
            "title": "David Hume (SEP)",
            "url": "https://plato.stanford.edu/entries/hume/",
            "note": "Free. Life, the copy principle, the science of man."
          },
          {
            "title": "Hume, An Enquiry Concerning Human Understanding (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/9662",
            "note": "Public domain. Section II."
          },
          {
            "title": "Hume, Treatise and Enquiries, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/hume",
            "note": "Free. Early Modern Texts."
          }
        ]
      ],
      [
        "Hume's fork: relations of ideas and matters of fact",
        [
          {
            "title": "David Hume (SEP)",
            "url": "https://plato.stanford.edu/entries/hume/",
            "note": "Free."
          },
          {
            "title": "Hume, An Enquiry Concerning Human Understanding (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/9662",
            "note": "Public domain. Section IV, Part I, and the end of section XII."
          }
        ]
      ],
      [
        "Hume: causation, constant conjunction and necessary connection",
        [
          {
            "title": "Hume, David: Causation (IEP)",
            "url": "https://iep.utm.edu/hume-cau/",
            "note": "Free. Includes the New Hume debate."
          },
          {
            "title": "David Hume (SEP)",
            "url": "https://plato.stanford.edu/entries/hume/",
            "note": "Free."
          },
          {
            "title": "Hume, An Enquiry Concerning Human Understanding (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/9662",
            "note": "Public domain. Section VII."
          }
        ]
      ],
      [
        "Reading: Hume's Enquiry, section IV, on induction",
        [
          {
            "title": "Hume, An Enquiry Concerning Human Understanding, ed. Selby-Bigge (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/9662",
            "note": "Public domain. The text quoted: section IV, Part II."
          },
          {
            "title": "The Problem of Induction (SEP)",
            "url": "https://plato.stanford.edu/entries/induction-problem/",
            "note": "Free. Hume's argument and the replies."
          },
          {
            "title": "Hume, Enquiry, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/hume",
            "note": "Free. Early Modern Texts."
          }
        ]
      ],
      [
        "Hume: the self as a bundle of perceptions",
        [
          {
            "title": "Hume, A Treatise of Human Nature (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/4705",
            "note": "Public domain. Book 1, Part 4, section 6, and the Appendix."
          },
          {
            "title": "David Hume (SEP)",
            "url": "https://plato.stanford.edu/entries/hume/",
            "note": "Free."
          }
        ]
      ],
      [
        "Hume: scepticism, and nature's cure for it",
        [
          {
            "title": "Hume, A Treatise of Human Nature (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/4705",
            "note": "Public domain. Book 1, Part 4, section 7."
          },
          {
            "title": "Hume, An Enquiry Concerning Human Understanding (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/9662",
            "note": "Public domain. Section XII."
          },
          {
            "title": "Hume, David (IEP)",
            "url": "https://iep.utm.edu/hume/",
            "note": "Free."
          }
        ]
      ],
      [
        "Shaftesbury, Hutcheson and Butler: the moral sense and conscience",
        [
          {
            "title": "Moral Sentimentalism (SEP)",
            "url": "https://plato.stanford.edu/entries/moral-sentimentalism/",
            "note": "Free. Shaftesbury to Smith, and the rationalist critics."
          },
          {
            "title": "Francis Hutcheson (SEP)",
            "url": "https://plato.stanford.edu/entries/hutcheson/",
            "note": "Free."
          },
          {
            "title": "Joseph Butler's Moral Philosophy (SEP)",
            "url": "https://plato.stanford.edu/entries/butler-moral/",
            "note": "Free. Butler's Fifteen Sermons is also modernised at earlymoderntexts.com."
          }
        ]
      ],
      [
        "Hume: reason the slave of the passions, is and ought, and the moral sentiments",
        [
          {
            "title": "Hume's Moral Philosophy (SEP)",
            "url": "https://plato.stanford.edu/entries/hume-moral/",
            "note": "Free."
          },
          {
            "title": "Hume, A Treatise of Human Nature (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/4705",
            "note": "Public domain. Book 2, Part 3, section 3; Book 3, Part 1, section 1."
          },
          {
            "title": "Hume, An Enquiry Concerning the Principles of Morals (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/4320",
            "note": "Public domain."
          }
        ]
      ],
      [
        "Hume on miracles",
        [
          {
            "title": "Miracles (SEP)",
            "url": "https://plato.stanford.edu/entries/miracles/",
            "note": "Free. Hume's argument and the probabilistic debate."
          },
          {
            "title": "Hume, An Enquiry Concerning Human Understanding (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/9662",
            "note": "Public domain. Section X."
          },
          {
            "title": "Hume on Religion (SEP)",
            "url": "https://plato.stanford.edu/entries/hume-religion/",
            "note": "Free."
          }
        ]
      ],
      [
        "Hume's Dialogues: the argument from design under fire",
        [
          {
            "title": "Hume, Dialogues Concerning Natural Religion (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/4583",
            "note": "Public domain."
          },
          {
            "title": "Teleological Arguments for God's Existence (SEP)",
            "url": "https://plato.stanford.edu/entries/teleological-arguments/",
            "note": "Free. From Hume to Paley, Darwin and fine-tuning."
          },
          {
            "title": "Hume, David: Religion (IEP)",
            "url": "https://iep.utm.edu/hume-rel/",
            "note": "Free."
          }
        ]
      ],
      [
        "Thomas Reid: common sense against the way of ideas",
        [
          {
            "title": "Thomas Reid (SEP)",
            "url": "https://plato.stanford.edu/entries/reid/",
            "note": "Free."
          },
          {
            "title": "Reid, Inquiry and Essays, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/reid",
            "note": "Free. Early Modern Texts."
          }
        ]
      ],
      [
        "Voltaire and Diderot: the French Enlightenment",
        [
          {
            "title": "Voltaire (SEP)",
            "url": "https://plato.stanford.edu/entries/voltaire/",
            "note": "Free."
          },
          {
            "title": "Denis Diderot (SEP)",
            "url": "https://plato.stanford.edu/entries/diderot/",
            "note": "Free."
          },
          {
            "title": "Voltaire, Candide (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/19942",
            "note": "Public domain."
          }
        ]
      ],
      [
        "Rousseau: the state of nature and the origin of inequality",
        [
          {
            "title": "Jean Jacques Rousseau (SEP)",
            "url": "https://plato.stanford.edu/entries/rousseau/",
            "note": "Free."
          },
          {
            "title": "Rousseau, The Social Contract and Discourses, tr. G. D. H. Cole (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/46333",
            "note": "Public domain. Includes the Discourse on Inequality."
          }
        ]
      ],
      [
        "Rousseau: the general will, the Social Contract and Emile",
        [
          {
            "title": "Rousseau, The Social Contract and Discourses, tr. G. D. H. Cole (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/46333",
            "note": "Public domain. The text quoted."
          },
          {
            "title": "Rousseau, Jean-Jacques (IEP)",
            "url": "https://iep.utm.edu/rousseau/",
            "note": "Free."
          },
          {
            "title": "Rousseau, Emile, tr. Barbara Foxley (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/5427",
            "note": "Public domain."
          }
        ]
      ],
      [
        "Adam Smith: sympathy and the impartial spectator",
        [
          {
            "title": "Adam Smith's Moral and Political Philosophy (SEP)",
            "url": "https://plato.stanford.edu/entries/smith-moral-political/",
            "note": "Free."
          },
          {
            "title": "Smith, The Theory of Moral Sentiments, 6th edition (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/67363",
            "note": "Public domain. The text quoted."
          },
          {
            "title": "Smith, Theory of Moral Sentiments, modernised by Jonathan Bennett",
            "url": "https://www.earlymoderntexts.com/authors/smith",
            "note": "Free. Early Modern Texts."
          }
        ]
      ],
      [
        "Burke and Wollstonecraft: tradition, revolution and the rights of woman",
        [
          {
            "title": "Edmund Burke (SEP)",
            "url": "https://plato.stanford.edu/entries/burke/",
            "note": "Free."
          },
          {
            "title": "Mary Wollstonecraft (SEP)",
            "url": "https://plato.stanford.edu/entries/wollstonecraft/",
            "note": "Free."
          },
          {
            "title": "Wollstonecraft, A Vindication of the Rights of Woman (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/3420",
            "note": "Public domain. Burke's Reflections is in his Works, vol. 3, Gutenberg ebook 15679."
          }
        ]
      ],
      [
        "Looking back: what the empiricists settled and what they handed to Kant",
        [
          {
            "title": "Enlightenment (SEP)",
            "url": "https://plato.stanford.edu/entries/enlightenment/",
            "note": "Free."
          },
          {
            "title": "The Problem of Induction (SEP)",
            "url": "https://plato.stanford.edu/entries/induction-problem/",
            "note": "Free. The open problem Hume left."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 10 · Kant and German idealism",
    "lessons": [
      [
        "Context: Prussia, the Enlightenment and the crisis of metaphysics",
        [
          {
            "title": "SEP: Enlightenment",
            "url": "https://plato.stanford.edu/entries/enlightenment/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Leibniz's Influence on Kant",
            "url": "https://plato.stanford.edu/entries/kant-leibniz/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: German Idealism",
            "url": "https://iep.utm.edu/germidea/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's life, the pre-critical years and Hume's wake-up call",
        [
          {
            "title": "SEP: Kant's Philosophical Development",
            "url": "https://plato.stanford.edu/entries/kant-development/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Kant and Hume on Causality",
            "url": "https://plato.stanford.edu/entries/kant-hume-causality/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Kant, Prolegomena to Any Future Metaphysics, ed. Paul Carus (1902)",
            "url": "https://www.gutenberg.org/ebooks/52821",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Kant's Copernican turn in the Critique of Pure Reason",
        [
          {
            "title": "SEP: Immanuel Kant",
            "url": "https://plato.stanford.edu/entries/kant/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Kant, The Critique of Pure Reason, tr. J. M. D. Meiklejohn (1855)",
            "url": "https://www.gutenberg.org/ebooks/4280",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Early Modern Texts: Immanuel Kant",
            "url": "https://www.earlymoderntexts.com/authors/kant",
            "note": "Jonathan Bennett's free modernised versions of Kant's main works."
          }
        ]
      ],
      [
        "Kant's judgments: analytic and synthetic, a priori and a posteriori",
        [
          {
            "title": "SEP: Kant's Theory of Judgment",
            "url": "https://plato.stanford.edu/entries/kant-judgment/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: The Analytic/Synthetic Distinction",
            "url": "https://plato.stanford.edu/entries/analytic-synthetic/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Kant's Philosophy of Mathematics",
            "url": "https://plato.stanford.edu/entries/kant-mathematics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's Transcendental Aesthetic: space and time as forms of intuition",
        [
          {
            "title": "SEP: Kant's Views on Space and Time",
            "url": "https://plato.stanford.edu/entries/kant-spacetime/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Kant: Metaphysics",
            "url": "https://iep.utm.edu/kantmeta/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's categories and the Transcendental Deduction",
        [
          {
            "title": "SEP: Kant's Transcendental Arguments",
            "url": "https://plato.stanford.edu/entries/kant-transcendental/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Kant's View of the Mind and Consciousness of Self",
            "url": "https://plato.stanford.edu/entries/kant-mind/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Kant, The Critique of Pure Reason, tr. J. M. D. Meiklejohn (1855)",
            "url": "https://www.gutenberg.org/ebooks/4280",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Kant's schematism and the Second Analogy's answer to Hume",
        [
          {
            "title": "SEP: Kant and Hume on Causality",
            "url": "https://plato.stanford.edu/entries/kant-hume-causality/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Kant's Philosophy of Science",
            "url": "https://plato.stanford.edu/entries/kant-science/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's Refutation of Idealism",
        [
          {
            "title": "SEP: Kant's Transcendental Idealism",
            "url": "https://plato.stanford.edu/entries/kant-transcendental-idealism/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Idealism",
            "url": "https://plato.stanford.edu/entries/idealism/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant on phenomena, noumena and the thing in itself",
        [
          {
            "title": "SEP: Kant's Transcendental Idealism",
            "url": "https://plato.stanford.edu/entries/kant-transcendental-idealism/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Kant: Metaphysics",
            "url": "https://iep.utm.edu/kantmeta/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's paralogisms: the illusion of a knowable soul",
        [
          {
            "title": "SEP: Kant's Critique of Metaphysics",
            "url": "https://plato.stanford.edu/entries/kant-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Kant's View of the Mind and Consciousness of Self",
            "url": "https://plato.stanford.edu/entries/kant-mind/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's antinomies of pure reason",
        [
          {
            "title": "SEP: Kant's Critique of Metaphysics",
            "url": "https://plato.stanford.edu/entries/kant-metaphysics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Kant's Account of Reason",
            "url": "https://plato.stanford.edu/entries/kant-reason/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's critique of the proofs of God",
        [
          {
            "title": "SEP: Kant's Philosophy of Religion",
            "url": "https://plato.stanford.edu/entries/kant-religion/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Ontological Arguments",
            "url": "https://plato.stanford.edu/entries/ontological-arguments/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Kant: Philosophy of Religion",
            "url": "https://iep.utm.edu/kant-rel/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Reading: Kant's Groundwork on the good will and duty",
        [
          {
            "title": "Kant, Fundamental Principles of the Metaphysic of Morals, tr. T. K. Abbott (1873)",
            "url": "https://www.gutenberg.org/ebooks/5682",
            "note": "Public domain, Project Gutenberg. The Groundwork."
          },
          {
            "title": "SEP: Kant's Moral Philosophy",
            "url": "https://plato.stanford.edu/entries/kant-moral/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Early Modern Texts: Immanuel Kant",
            "url": "https://www.earlymoderntexts.com/authors/kant",
            "note": "Jonathan Bennett's free modernised versions of Kant's main works."
          }
        ]
      ],
      [
        "Kant's categorical imperative: the formula of universal law",
        [
          {
            "title": "SEP: Kant's Moral Philosophy",
            "url": "https://plato.stanford.edu/entries/kant-moral/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Kant, Fundamental Principles of the Metaphysic of Morals, tr. T. K. Abbott (1873)",
            "url": "https://www.gutenberg.org/ebooks/5682",
            "note": "Public domain, Project Gutenberg. The Groundwork."
          }
        ]
      ],
      [
        "Kant on humanity, autonomy and the kingdom of ends",
        [
          {
            "title": "SEP: Kant's Moral Philosophy",
            "url": "https://plato.stanford.edu/entries/kant-moral/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Autonomy in Moral and Political Philosophy",
            "url": "https://plato.stanford.edu/entries/autonomy-moral/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's Critique of Practical Reason and the postulates",
        [
          {
            "title": "Kant, The Critique of Practical Reason, tr. T. K. Abbott",
            "url": "https://www.gutenberg.org/ebooks/5683",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SEP: Kant's Philosophy of Religion",
            "url": "https://plato.stanford.edu/entries/kant-religion/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Kant's Critique of Judgment: beauty, the sublime and purposiveness",
        [
          {
            "title": "SEP: Kant's Aesthetics and Teleology",
            "url": "https://plato.stanford.edu/entries/kant-aesthetics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Kant: Aesthetics",
            "url": "https://iep.utm.edu/kantaest/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Kant, Critique of Judgement, tr. J. H. Bernard (1892; 2nd ed. 1914)",
            "url": "https://www.gutenberg.org/ebooks/48433",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Kant on enlightenment and perpetual peace",
        [
          {
            "title": "SEP: Kant's Social and Political Philosophy",
            "url": "https://plato.stanford.edu/entries/kant-social-political/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Kant, Perpetual Peace, tr. M. Campbell Smith (1903)",
            "url": "https://www.gutenberg.org/ebooks/50922",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SEP: Cosmopolitanism",
            "url": "https://plato.stanford.edu/entries/cosmopolitanism/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The first reaction to Kant: Jacobi, Hamann and Herder",
        [
          {
            "title": "SEP: Friedrich Heinrich Jacobi",
            "url": "https://plato.stanford.edu/entries/friedrich-jacobi/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Johann Georg Hamann",
            "url": "https://plato.stanford.edu/entries/hamann/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Johann Gottfried von Herder",
            "url": "https://plato.stanford.edu/entries/herder/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Fichte: the I and the not-I",
        [
          {
            "title": "SEP: Johann Gottlieb Fichte",
            "url": "https://plato.stanford.edu/entries/johann-fichte/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Johann Gottlieb Fichte",
            "url": "https://iep.utm.edu/fichtejg/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Schelling: nature philosophy and the identity of nature and mind",
        [
          {
            "title": "SEP: Friedrich Wilhelm Joseph von Schelling",
            "url": "https://plato.stanford.edu/entries/schelling/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: F. W. J. von Schelling",
            "url": "https://iep.utm.edu/schellin/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Hegel: the Phenomenology of Spirit and the master and slave",
        [
          {
            "title": "SEP: Georg Wilhelm Friedrich Hegel",
            "url": "https://plato.stanford.edu/entries/hegel/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Hegel",
            "url": "https://iep.utm.edu/hegel/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Hegel's dialectic, Geist and the Science of Logic",
        [
          {
            "title": "SEP: Hegel's Dialectics",
            "url": "https://plato.stanford.edu/entries/hegel-dialectics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Hegel, The Logic of Hegel (the Encyclopaedia Logic), tr. William Wallace",
            "url": "https://www.gutenberg.org/ebooks/55108",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Hegel's Philosophy of Right and history as the progress of freedom",
        [
          {
            "title": "SEP: Hegel's Social and Political Philosophy",
            "url": "https://plato.stanford.edu/entries/hegel-social-political/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: Hegel: Social and Political Thought",
            "url": "https://iep.utm.edu/hegelsoc/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "The Right and Left Hegelians",
        [
          {
            "title": "SEP: Ludwig Andreas Feuerbach",
            "url": "https://plato.stanford.edu/entries/ludwig-feuerbach/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Bruno Bauer",
            "url": "https://plato.stanford.edu/entries/bauer/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Max Stirner",
            "url": "https://plato.stanford.edu/entries/max-stirner/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Looking back: what Kant and the idealists settled and left open",
        [
          {
            "title": "SEP: Immanuel Kant",
            "url": "https://plato.stanford.edu/entries/kant/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "SEP: Georg Wilhelm Friedrich Hegel",
            "url": "https://plato.stanford.edu/entries/hegel/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "IEP: German Idealism",
            "url": "https://iep.utm.edu/germidea/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 11 · The nineteenth century",
    "lessons": [
      [
        "Context: Europe after Hegel, from the railway to the death of God",
        [
          {
            "title": "SEP: Georg Wilhelm Friedrich Hegel",
            "url": "https://plato.stanford.edu/entries/hegel/",
            "note": "Stanford Encyclopedia of Philosophy, free online. For the system the century reacted against."
          },
          {
            "title": "SEP: Ludwig Andreas Feuerbach",
            "url": "https://plato.stanford.edu/entries/ludwig-feuerbach/",
            "note": "Stanford Encyclopedia of Philosophy, free online. Good on the Young Hegelians."
          }
        ]
      ],
      [
        "Schopenhauer: the world as will and representation",
        [
          {
            "title": "SEP: Arthur Schopenhauer",
            "url": "https://plato.stanford.edu/entries/schopenhauer/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "Schopenhauer, The World as Will and Idea, vol. 1, tr. R. B. Haldane and J. Kemp",
            "url": "https://www.gutenberg.org/ebooks/38427",
            "note": "Public domain, Project Gutenberg. The translation quoted in the lesson (first published 1883)."
          }
        ]
      ],
      [
        "Schopenhauer: pessimism, art and the denial of the will",
        [
          {
            "title": "SEP: Schopenhauer's Aesthetics",
            "url": "https://plato.stanford.edu/entries/schopenhauer-aesthetics/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "IEP: Arthur Schopenhauer",
            "url": "https://iep.utm.edu/schopenh/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Kierkegaard: the pseudonyms and the three stages of existence",
        [
          {
            "title": "SEP: Søren Kierkegaard",
            "url": "https://plato.stanford.edu/entries/kierkegaard/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "IEP: Søren Kierkegaard",
            "url": "https://iep.utm.edu/kierkega/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Kierkegaard: Fear and Trembling and the teleological suspension of the ethical",
        [
          {
            "title": "SEP: Søren Kierkegaard",
            "url": "https://plato.stanford.edu/entries/kierkegaard/",
            "note": "Stanford Encyclopedia of Philosophy, free online. See the section on Fear and Trembling."
          },
          {
            "title": "IEP: Søren Kierkegaard",
            "url": "https://iep.utm.edu/kierkega/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Kierkegaard: anxiety, despair and the claim that subjectivity is truth",
        [
          {
            "title": "SEP: Søren Kierkegaard",
            "url": "https://plato.stanford.edu/entries/kierkegaard/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "IEP: Søren Kierkegaard",
            "url": "https://iep.utm.edu/kierkega/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Feuerbach: theology is anthropology",
        [
          {
            "title": "SEP: Ludwig Andreas Feuerbach",
            "url": "https://plato.stanford.edu/entries/ludwig-feuerbach/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "Feuerbach, The Essence of Christianity, tr. George Eliot (1854)",
            "url": "https://www.gutenberg.org/ebooks/47025",
            "note": "Public domain, Project Gutenberg. The translation quoted in the lesson."
          }
        ]
      ],
      [
        "Marx: alienated labour in the 1844 Manuscripts",
        [
          {
            "title": "SEP: Karl Marx",
            "url": "https://plato.stanford.edu/entries/marx/",
            "note": "Stanford Encyclopedia of Philosophy, free online. Section on the 1844 Manuscripts and alienation."
          }
        ]
      ],
      [
        "Marx: historical materialism, base and superstructure",
        [
          {
            "title": "SEP: Karl Marx",
            "url": "https://plato.stanford.edu/entries/marx/",
            "note": "Stanford Encyclopedia of Philosophy, free online. Section on the theory of history, including Cohen's reconstruction."
          },
          {
            "title": "SEP: Analytical Marxism",
            "url": "https://plato.stanford.edu/entries/marxism-analytical/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Marx: class struggle and ideology",
        [
          {
            "title": "Marx and Engels, The Communist Manifesto, tr. Samuel Moore (1888)",
            "url": "https://www.gutenberg.org/ebooks/61",
            "note": "Public domain, Project Gutenberg. The translation quoted in the lesson."
          },
          {
            "title": "SEP: Ideology",
            "url": "https://plato.stanford.edu/entries/ideology/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Marx: surplus value as an argument, and its critics",
        [
          {
            "title": "SEP: Exploitation",
            "url": "https://plato.stanford.edu/entries/exploitation/",
            "note": "Stanford Encyclopedia of Philosophy, free online. Covers Marx's account and the analytic Marxist revisions."
          },
          {
            "title": "SEP: Analytical Marxism",
            "url": "https://plato.stanford.edu/entries/marxism-analytical/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Comte: positivism and the law of three stages",
        [
          {
            "title": "SEP: Auguste Comte",
            "url": "https://plato.stanford.edu/entries/comte/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Bentham: the principle of utility and the felicific calculus",
        [
          {
            "title": "Bentham, An Introduction to the Principles of Morals and Legislation, chapter 1",
            "url": "https://en.wikisource.org/wiki/An_Introduction_to_the_Principles_of_Morals_and_Legislation/Chapter_I",
            "note": "Public domain, Wikisource. The text quoted in the lesson."
          },
          {
            "title": "SEP: Jeremy Bentham",
            "url": "https://plato.stanford.edu/entries/bentham/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "IEP: Jeremy Bentham",
            "url": "https://iep.utm.edu/bentham/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Mill: Utilitarianism and the higher pleasures",
        [
          {
            "title": "Mill, Utilitarianism",
            "url": "https://www.gutenberg.org/ebooks/11224",
            "note": "Public domain, Project Gutenberg. The text quoted in the lesson."
          },
          {
            "title": "SEP: Mill's Moral and Political Philosophy",
            "url": "https://plato.stanford.edu/entries/mill-moral-political/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Mill: the proof of the principle of utility",
        [
          {
            "title": "Mill, Utilitarianism, chapter 4",
            "url": "https://www.gutenberg.org/ebooks/11224",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SEP: The History of Utilitarianism",
            "url": "https://plato.stanford.edu/entries/utilitarianism-history/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Mill: On Liberty and the harm principle",
        [
          {
            "title": "SEP: Mill's Moral and Political Philosophy",
            "url": "https://plato.stanford.edu/entries/mill-moral-political/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "SEP: Freedom of Speech",
            "url": "https://plato.stanford.edu/entries/freedom-speech/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "SEP: Paternalism",
            "url": "https://plato.stanford.edu/entries/paternalism/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Reading: Mill's On Liberty, chapter 1, the one very simple principle",
        [
          {
            "title": "Mill, On Liberty (Walter Scott Publishing Co. edition, 1901)",
            "url": "https://www.gutenberg.org/ebooks/34901",
            "note": "Public domain, Project Gutenberg. The text read in the lesson; chapter 1, Introductory."
          }
        ]
      ],
      [
        "Mill: The Subjection of Women",
        [
          {
            "title": "Mill, The Subjection of Women (1869)",
            "url": "https://www.gutenberg.org/ebooks/27083",
            "note": "Public domain, Project Gutenberg. The text quoted in the lesson."
          },
          {
            "title": "SEP: Liberal Feminism",
            "url": "https://plato.stanford.edu/entries/feminism-liberal/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Mill: the System of Logic, induction and the uniformity of nature",
        [
          {
            "title": "SEP: John Stuart Mill",
            "url": "https://plato.stanford.edu/entries/mill/",
            "note": "Stanford Encyclopedia of Philosophy, free online. Strong on the Logic."
          },
          {
            "title": "Mill, A System of Logic, Ratiocinative and Inductive",
            "url": "https://www.gutenberg.org/ebooks/27942",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SEP: The Problem of Induction",
            "url": "https://plato.stanford.edu/entries/induction-problem/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Sidgwick: The Methods of Ethics and the dualism of practical reason",
        [
          {
            "title": "SEP: Henry Sidgwick",
            "url": "https://plato.stanford.edu/entries/sidgwick/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "Sidgwick, The Methods of Ethics",
            "url": "https://www.gutenberg.org/ebooks/46743",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Darwin's challenge to philosophy",
        [
          {
            "title": "Darwin, On the Origin of Species (first edition, 1859)",
            "url": "https://www.gutenberg.org/ebooks/1228",
            "note": "Public domain, Project Gutenberg. The text quoted in the lesson."
          },
          {
            "title": "SEP: Darwinism",
            "url": "https://plato.stanford.edu/entries/darwinism/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "IEP: Evolutionary Ethics",
            "url": "https://iep.utm.edu/evol-eth/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Nietzsche: the madman and the death of God",
        [
          {
            "title": "SEP: Friedrich Nietzsche",
            "url": "https://plato.stanford.edu/entries/nietzsche/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "Nietzsche, The Joyful Wisdom, tr. Thomas Common (1910)",
            "url": "https://www.gutenberg.org/ebooks/52881",
            "note": "Public domain, Project Gutenberg. The translation quoted in the lesson; section 125."
          }
        ]
      ],
      [
        "Nietzsche: master morality and slave morality",
        [
          {
            "title": "SEP: Nietzsche's Moral and Political Philosophy",
            "url": "https://plato.stanford.edu/entries/nietzsche-moral-political/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "Nietzsche, The Genealogy of Morals, tr. Horace B. Samuel",
            "url": "https://www.gutenberg.org/ebooks/52319",
            "note": "Public domain, Project Gutenberg. The translation quoted in the lesson."
          }
        ]
      ],
      [
        "Nietzsche: will to power, eternal recurrence and the Übermensch",
        [
          {
            "title": "SEP: Friedrich Nietzsche",
            "url": "https://plato.stanford.edu/entries/nietzsche/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "Nietzsche, Thus Spake Zarathustra, tr. Thomas Common",
            "url": "https://www.gutenberg.org/ebooks/1998",
            "note": "Public domain, Project Gutenberg. The translation quoted in the lesson."
          },
          {
            "title": "IEP: Friedrich Nietzsche",
            "url": "https://iep.utm.edu/nietzsch/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Nietzsche: perspectivism, and how his sister's edition served the Nazis",
        [
          {
            "title": "SEP: Nietzsche's Life and Works",
            "url": "https://plato.stanford.edu/entries/nietzsche-life-works/",
            "note": "Stanford Encyclopedia of Philosophy, free online. Covers Elisabeth Förster-Nietzsche and the editions."
          },
          {
            "title": "SEP: Friedrich Nietzsche",
            "url": "https://plato.stanford.edu/entries/nietzsche/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Peirce: the pragmatic maxim and fallibilism",
        [
          {
            "title": "Peirce, How to Make Our Ideas Clear (Popular Science Monthly, January 1878)",
            "url": "https://en.wikisource.org/wiki/Popular_Science_Monthly/Volume_12/January_1878/Illustrations_of_the_Logic_of_Science_II",
            "note": "Public domain, Wikisource. The text quoted in the lesson."
          },
          {
            "title": "SEP: Charles Sanders Peirce",
            "url": "https://plato.stanford.edu/entries/peirce/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "IEP: Peirce, Pragmatism",
            "url": "https://iep.utm.edu/peircepr/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "William James: The Will to Believe and the pragmatist theory of truth",
        [
          {
            "title": "James, The Will to Believe, and Other Essays (1897)",
            "url": "https://www.gutenberg.org/ebooks/26659",
            "note": "Public domain, Project Gutenberg. The text quoted in the lesson."
          },
          {
            "title": "James, Pragmatism (1907)",
            "url": "https://www.gutenberg.org/ebooks/5116",
            "note": "Public domain, Project Gutenberg. The text quoted in the lesson."
          },
          {
            "title": "SEP: The Pragmatic Theory of Truth",
            "url": "https://plato.stanford.edu/entries/truth-pragmatic/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Solovyov and the Russian religious philosophers",
        [
          {
            "title": "IEP: Vladimir Solovyov",
            "url": "https://iep.utm.edu/solovyov/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Brentano: intentionality, the mark of the mental",
        [
          {
            "title": "SEP: Franz Brentano",
            "url": "https://plato.stanford.edu/entries/brentano/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "SEP: Intentionality",
            "url": "https://plato.stanford.edu/entries/intentionality/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "IEP: Franz Brentano",
            "url": "https://iep.utm.edu/brentano/",
            "note": "Internet Encyclopedia of Philosophy, free online."
          }
        ]
      ],
      [
        "Looking back: the nineteenth century, from Hegel's system to the open questions",
        [
          {
            "title": "SEP: Pragmatism",
            "url": "https://plato.stanford.edu/entries/pragmatism/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          },
          {
            "title": "SEP: The History of Utilitarianism",
            "url": "https://plato.stanford.edu/entries/utilitarianism-history/",
            "note": "Stanford Encyclopedia of Philosophy, free online."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 12 · The analytic turn",
    "lessons": [
      [
        "Context: logic, mathematics and the revolt against idealism",
        [
          {
            "title": "IEP: Analytic Philosophy",
            "url": "https://iep.utm.edu/analytic-philosophy/",
            "note": "Internet Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Francis Herbert Bradley",
            "url": "https://plato.stanford.edu/entries/bradley/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Frege: the Begriffsschrift and the birth of modern logic",
        [
          {
            "title": "SEP: Gottlob Frege",
            "url": "https://plato.stanford.edu/entries/frege/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Frege's Logic",
            "url": "https://plato.stanford.edu/entries/frege-logic/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Frege: logicism and the Foundations of Arithmetic",
        [
          {
            "title": "SEP: Frege's Theorem and Foundations for Arithmetic",
            "url": "https://plato.stanford.edu/entries/frege-theorem/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Logicism and Neologicism",
            "url": "https://plato.stanford.edu/entries/logicism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Frege: sense and reference",
        [
          {
            "title": "IEP: Frege, Gottlob",
            "url": "https://iep.utm.edu/frege/",
            "note": "Internet Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Gottlob Frege",
            "url": "https://plato.stanford.edu/entries/frege/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Russell's paradox and Principia Mathematica",
        [
          {
            "title": "SEP: Russell's Paradox",
            "url": "https://plato.stanford.edu/entries/russell-paradox/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Principia Mathematica",
            "url": "https://plato.stanford.edu/entries/principia-mathematica/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Bertrand Russell",
            "url": "https://plato.stanford.edu/entries/russell/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Russell: the theory of descriptions",
        [
          {
            "title": "SEP: Descriptions",
            "url": "https://plato.stanford.edu/entries/descriptions/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "Bertrand Russell, \"On Denoting\" (1905)",
            "url": "https://en.wikisource.org/wiki/On_Denoting",
            "note": "The paper itself, on Wikisource; public domain."
          }
        ]
      ],
      [
        "Reading: Russell on knowledge by acquaintance and by description",
        [
          {
            "title": "Bertrand Russell, The Problems of Philosophy (1912)",
            "url": "https://www.gutenberg.org/ebooks/5827",
            "note": "Public domain, Project Gutenberg. The reading lesson quotes Chapter V; the last lesson quotes Chapter XV."
          },
          {
            "title": "SEP: Knowledge by Acquaintance vs. Description",
            "url": "https://plato.stanford.edu/entries/knowledge-acquaindescrip/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Russell: logical atomism",
        [
          {
            "title": "SEP: Russell's Logical Atomism",
            "url": "https://plato.stanford.edu/entries/logical-atomism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Russell, Bertrand: Metaphysics",
            "url": "https://iep.utm.edu/russ-met/",
            "note": "Internet Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Moore: the refutation of idealism and the defence of common sense",
        [
          {
            "title": "SEP: George Edward Moore",
            "url": "https://plato.stanford.edu/entries/moore/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Moore, George Edward",
            "url": "https://iep.utm.edu/moore/",
            "note": "Internet Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Moore: the open-question argument and the naturalistic fallacy",
        [
          {
            "title": "SEP: Moore's Moral Philosophy",
            "url": "https://plato.stanford.edu/entries/moore-moral/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "G. E. Moore, Principia Ethica (1903)",
            "url": "https://www.gutenberg.org/ebooks/53430",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Wittgenstein's Tractatus: the picture theory of meaning",
        [
          {
            "title": "SEP: Ludwig Wittgenstein",
            "url": "https://plato.stanford.edu/entries/wittgenstein/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Wittgenstein's Logical Atomism",
            "url": "https://plato.stanford.edu/entries/wittgenstein-atomism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Wittgenstein's Tractatus: what can be said and what can only be shown",
        [
          {
            "title": "SEP: Ludwig Wittgenstein",
            "url": "https://plato.stanford.edu/entries/wittgenstein/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Wittgenstein, Ludwig",
            "url": "https://iep.utm.edu/wittgens/",
            "note": "Internet Encyclopedia of Philosophy; free."
          },
          {
            "title": "Wittgenstein, Tractatus Logico-Philosophicus, tr. C. K. Ogden (1922)",
            "url": "https://www.gutenberg.org/ebooks/5740",
            "note": "Project Gutenberg (PDF/TeX). Public domain in the US; check local copyright elsewhere."
          }
        ]
      ],
      [
        "The Vienna Circle and the verification principle",
        [
          {
            "title": "SEP: Vienna Circle",
            "url": "https://plato.stanford.edu/entries/vienna-circle/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Logical Empiricism",
            "url": "https://plato.stanford.edu/entries/logical-empiricism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Ayer and emotivism: ethics as the expression of feeling",
        [
          {
            "title": "SEP: Alfred Jules Ayer",
            "url": "https://plato.stanford.edu/entries/ayer/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Moral Cognitivism vs. Non-Cognitivism",
            "url": "https://plato.stanford.edu/entries/moral-cognitivism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Logical positivism undone: the self-refutation objection and its fellows",
        [
          {
            "title": "SEP: Logical Empiricism",
            "url": "https://plato.stanford.edu/entries/logical-empiricism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: The Analytic/Synthetic Distinction",
            "url": "https://plato.stanford.edu/entries/analytic-synthetic/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Popper: falsification and the problem of demarcation",
        [
          {
            "title": "SEP: Karl Popper",
            "url": "https://plato.stanford.edu/entries/popper/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Popper, Karl: Philosophy of Science",
            "url": "https://iep.utm.edu/pop-sci/",
            "note": "Internet Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Science and Pseudo-Science",
            "url": "https://plato.stanford.edu/entries/pseudo-science/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Kuhn: paradigms, normal science and revolutions",
        [
          {
            "title": "SEP: Thomas Kuhn",
            "url": "https://plato.stanford.edu/entries/thomas-kuhn/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: The Incommensurability of Scientific Theories",
            "url": "https://plato.stanford.edu/entries/incommensurability/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Wittgenstein's Investigations: meaning as use and language-games",
        [
          {
            "title": "SEP: Ludwig Wittgenstein",
            "url": "https://plato.stanford.edu/entries/wittgenstein/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Wittgenstein, Ludwig",
            "url": "https://iep.utm.edu/wittgens/",
            "note": "Internet Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Wittgenstein's Investigations: rule-following and the private language argument",
        [
          {
            "title": "SEP: Private Language",
            "url": "https://plato.stanford.edu/entries/private-language/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Ludwig Wittgenstein",
            "url": "https://plato.stanford.edu/entries/wittgenstein/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Ryle: the ghost in the machine and the category mistake",
        [
          {
            "title": "SEP: Gilbert Ryle",
            "url": "https://plato.stanford.edu/entries/ryle/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Knowledge How",
            "url": "https://plato.stanford.edu/entries/knowledge-how/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Austin: speech acts and doing things with words",
        [
          {
            "title": "SEP: John Langshaw Austin",
            "url": "https://plato.stanford.edu/entries/austin-jl/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Speech Acts",
            "url": "https://plato.stanford.edu/entries/speech-acts/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Implicature",
            "url": "https://plato.stanford.edu/entries/implicature/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Quine: Two Dogmas of Empiricism and the web of belief",
        [
          {
            "title": "SEP: The Analytic/Synthetic Distinction",
            "url": "https://plato.stanford.edu/entries/analytic-synthetic/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Quine, Willard Van Orman: Analytic/Synthetic Distinction",
            "url": "https://iep.utm.edu/quine/",
            "note": "Internet Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Quine: naturalised epistemology and the indeterminacy of translation",
        [
          {
            "title": "SEP: Willard Van Orman Quine",
            "url": "https://plato.stanford.edu/entries/quine/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Naturalism in Epistemology",
            "url": "https://plato.stanford.edu/entries/epistemology-naturalized/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Gettier: is knowledge justified true belief?",
        [
          {
            "title": "SEP: The Analysis of Knowledge",
            "url": "https://plato.stanford.edu/entries/knowledge-analysis/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Gettier Problems",
            "url": "https://iep.utm.edu/gettier/",
            "note": "Internet Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Kripke: naming, necessity and rigid designation",
        [
          {
            "title": "SEP: Names",
            "url": "https://plato.stanford.edu/entries/names/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Rigid Designators",
            "url": "https://plato.stanford.edu/entries/rigid-designators/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Philosophy of mind: behaviourism, identity theory and functionalism",
        [
          {
            "title": "SEP: Behaviorism",
            "url": "https://plato.stanford.edu/entries/behaviorism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: The Mind/Brain Identity Theory",
            "url": "https://plato.stanford.edu/entries/mind-identity/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: Functionalism",
            "url": "https://plato.stanford.edu/entries/functionalism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Putnam: Twin Earth and the meaning of 'meaning'",
        [
          {
            "title": "SEP: Externalism About the Mind",
            "url": "https://plato.stanford.edu/entries/content-externalism/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Turing's imitation game and Searle's Chinese room",
        [
          {
            "title": "SEP: The Turing Test",
            "url": "https://plato.stanford.edu/entries/turing-test/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "SEP: The Chinese Room Argument",
            "url": "https://plato.stanford.edu/entries/chinese-room/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Chinese Room Argument",
            "url": "https://iep.utm.edu/chineser/",
            "note": "Internet Encyclopedia of Philosophy; free."
          }
        ]
      ],
      [
        "Looking back: what the analytic turn settled and left open",
        [
          {
            "title": "SEP: Analysis",
            "url": "https://plato.stanford.edu/entries/analysis/",
            "note": "Stanford Encyclopedia of Philosophy; free."
          },
          {
            "title": "IEP: Analytic Philosophy",
            "url": "https://iep.utm.edu/analytic-philosophy/",
            "note": "Internet Encyclopedia of Philosophy; free."
          },
          {
            "title": "Bertrand Russell, The Problems of Philosophy (1912)",
            "url": "https://www.gutenberg.org/ebooks/5827",
            "note": "Public domain, Project Gutenberg. The reading lesson quotes Chapter V; the last lesson quotes Chapter XV."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 13 · The continental line",
    "lessons": [
      [
        "Context: Europe from 1900 to 1980, war, occupation and the university",
        [
          {
            "title": "Existentialism (SEP)",
            "url": "https://plato.stanford.edu/entries/existentialism/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Critical Theory (Frankfurt School) (SEP)",
            "url": "https://plato.stanford.edu/entries/critical-theory/",
            "note": "Stanford Encyclopedia of Philosophy. Free. Covers the Institute's history and exile."
          }
        ]
      ],
      [
        "What \"continental\" means: the analytic–continental split",
        [
          {
            "title": "Analytic Philosophy (IEP)",
            "url": "https://iep.utm.edu/analytic-philosophy/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Phenomenology (SEP)",
            "url": "https://plato.stanford.edu/entries/phenomenology/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Husserl: intentionality and the founding of phenomenology",
        [
          {
            "title": "Edmund Husserl (SEP)",
            "url": "https://plato.stanford.edu/entries/husserl/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Franz Brentano (SEP)",
            "url": "https://plato.stanford.edu/entries/brentano/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Intentionality (SEP)",
            "url": "https://plato.stanford.edu/entries/intentionality/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Husserl: the epoché, the transcendental ego and the lifeworld",
        [
          {
            "title": "Husserl, Edmund (IEP)",
            "url": "https://iep.utm.edu/husserl/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Edmund Husserl (SEP)",
            "url": "https://plato.stanford.edu/entries/husserl/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Heidegger: Being and Time and the question of Being",
        [
          {
            "title": "Martin Heidegger (SEP)",
            "url": "https://plato.stanford.edu/entries/heidegger/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Heidegger, Martin (IEP)",
            "url": "https://iep.utm.edu/heidegge/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Heidegger: being-in-the-world and the ready-to-hand",
        [
          {
            "title": "Martin Heidegger (SEP)",
            "url": "https://plato.stanford.edu/entries/heidegger/",
            "note": "Stanford Encyclopedia of Philosophy. Free. Section on being-in-the-world and equipment."
          },
          {
            "title": "Hubert Dreyfus, Being-in-the-World: A Commentary on Heidegger's Being and Time, Division I (1991)",
            "note": "Printed book, by Hubert Dreyfus. The standard commentary on Division One."
          }
        ]
      ],
      [
        "Heidegger: das Man, anxiety, being-towards-death and authenticity",
        [
          {
            "title": "Martin Heidegger (SEP)",
            "url": "https://plato.stanford.edu/entries/heidegger/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Existentialism (SEP)",
            "url": "https://plato.stanford.edu/entries/existentialism/",
            "note": "Stanford Encyclopedia of Philosophy. Free. On anxiety and authenticity across the movement."
          }
        ]
      ],
      [
        "The later Heidegger: the turn, technology and dwelling",
        [
          {
            "title": "Heidegger, Martin (IEP)",
            "url": "https://iep.utm.edu/heidegge/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Heidegger's Aesthetics (SEP)",
            "url": "https://plato.stanford.edu/entries/heidegger-aesthetics/",
            "note": "Stanford Encyclopedia of Philosophy. Free. On the later work, technology and the history of Being."
          }
        ]
      ],
      [
        "Heidegger's Nazism and the Black Notebooks",
        [
          {
            "title": "Martin Heidegger (SEP)",
            "url": "https://plato.stanford.edu/entries/heidegger/",
            "note": "Stanford Encyclopedia of Philosophy. Free. Includes the political record."
          },
          {
            "title": "Peter Trawny, Heidegger and the Myth of a Jewish World Conspiracy (2014; English 2015)",
            "note": "Printed book, by Peter Trawny, editor of the Black Notebooks."
          }
        ]
      ],
      [
        "Jaspers: limit situations, the encompassing and the question of German guilt",
        [
          {
            "title": "Karl Jaspers (SEP)",
            "url": "https://plato.stanford.edu/entries/jaspers/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Reading: Dostoevsky's Grand Inquisitor and the burden of freedom",
        [
          {
            "title": "Dostoevsky, The Brothers Karamazov, tr. Constance Garnett (1912)",
            "url": "https://www.gutenberg.org/ebooks/28054",
            "note": "Public domain, Project Gutenberg. The Grand Inquisitor is Book V, chapter 5."
          },
          {
            "title": "Existentialism (SEP)",
            "url": "https://plato.stanford.edu/entries/existentialism/",
            "note": "Stanford Encyclopedia of Philosophy. Free. On Dostoevsky as a forerunner and on freedom and anguish."
          }
        ]
      ],
      [
        "Sartre: existence precedes essence and radical freedom",
        [
          {
            "title": "Jean-Paul Sartre (SEP)",
            "url": "https://plato.stanford.edu/entries/sartre/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Sartre, Jean Paul: Existentialism (IEP)",
            "url": "https://iep.utm.edu/sartre-ex/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Sartre: bad faith and the look",
        [
          {
            "title": "Jean-Paul Sartre (SEP)",
            "url": "https://plato.stanford.edu/entries/sartre/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Sartre, Jean Paul: Existentialism (IEP)",
            "url": "https://iep.utm.edu/sartre-ex/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Simone de Beauvoir: The Second Sex and The Ethics of Ambiguity",
        [
          {
            "title": "Simone de Beauvoir (SEP)",
            "url": "https://plato.stanford.edu/entries/beauvoir/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Beauvoir, Simone de (IEP)",
            "url": "https://iep.utm.edu/beauvoir/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Feminist Perspectives on Sex and Gender (SEP)",
            "url": "https://plato.stanford.edu/entries/feminism-gender/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Camus: the absurd and The Myth of Sisyphus",
        [
          {
            "title": "Albert Camus (SEP)",
            "url": "https://plato.stanford.edu/entries/camus/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Camus, Albert (IEP)",
            "url": "https://iep.utm.edu/camus/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Camus: The Rebel and the break with Sartre",
        [
          {
            "title": "Albert Camus (SEP)",
            "url": "https://plato.stanford.edu/entries/camus/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Ronald Aronson, Camus and Sartre: The Story of a Friendship and the Quarrel that Ended It (2004)",
            "note": "Printed book, by Ronald Aronson."
          }
        ]
      ],
      [
        "Merleau-Ponty: the lived body and perception",
        [
          {
            "title": "Maurice Merleau-Ponty (SEP)",
            "url": "https://plato.stanford.edu/entries/merleau-ponty/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Merleau-Ponty, Maurice (IEP)",
            "url": "https://iep.utm.edu/merleau/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Levinas: the face of the other and ethics as first philosophy",
        [
          {
            "title": "Emmanuel Levinas (SEP)",
            "url": "https://plato.stanford.edu/entries/levinas/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Religious existentialism and personalism: Marcel, Berdyaev and Buber",
        [
          {
            "title": "Gabriel (-Honoré) Marcel (SEP)",
            "url": "https://plato.stanford.edu/entries/marcel/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Martin Buber (SEP)",
            "url": "https://plato.stanford.edu/entries/buber/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Russian Philosophy (IEP)",
            "url": "https://iep.utm.edu/russian/",
            "note": "Internet Encyclopedia of Philosophy. Free. Includes Berdyaev."
          }
        ]
      ],
      [
        "The Frankfurt School: Adorno, Horkheimer and the Dialectic of Enlightenment",
        [
          {
            "title": "Critical Theory (Frankfurt School) (SEP)",
            "url": "https://plato.stanford.edu/entries/critical-theory/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Theodor W. Adorno (SEP)",
            "url": "https://plato.stanford.edu/entries/adorno/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Herbert Marcuse (SEP)",
            "url": "https://plato.stanford.edu/entries/marcuse/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Habermas: communicative reason and the public sphere",
        [
          {
            "title": "Jürgen Habermas (SEP)",
            "url": "https://plato.stanford.edu/entries/habermas/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Habermas, Jürgen (IEP)",
            "url": "https://iep.utm.edu/habermas/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Arendt: the banality of evil and The Human Condition",
        [
          {
            "title": "Hannah Arendt (SEP)",
            "url": "https://plato.stanford.edu/entries/arendt/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Arendt, Hannah (IEP)",
            "url": "https://iep.utm.edu/arendt/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Hermeneutics: Gadamer and Ricoeur",
        [
          {
            "title": "Hermeneutics (SEP)",
            "url": "https://plato.stanford.edu/entries/hermeneutics/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Hans-Georg Gadamer (SEP)",
            "url": "https://plato.stanford.edu/entries/gadamer/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Paul Ricoeur (SEP)",
            "url": "https://plato.stanford.edu/entries/ricoeur/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Saussure and structuralism: Lévi-Strauss and the system of differences",
        [
          {
            "title": "Saussure, Cours de linguistique générale (1916), French text",
            "url": "https://fr.wikisource.org/wiki/Cours_de_linguistique_g%C3%A9n%C3%A9rale",
            "note": "Public domain, French Wikisource. The original, in French."
          },
          {
            "title": "Aesthetics in Continental Philosophy (IEP), section 6",
            "url": "https://iep.utm.edu/aesthetics-in-continental-phil/",
            "note": "Internet Encyclopedia of Philosophy. Free. Section 6 sums up structuralism (Saussure, Lévi-Strauss, Barthes) and what followed."
          }
        ]
      ],
      [
        "Foucault: power, knowledge, discipline and sexuality",
        [
          {
            "title": "Michel Foucault (SEP)",
            "url": "https://plato.stanford.edu/entries/foucault/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Foucault, Michel (IEP)",
            "url": "https://iep.utm.edu/foucault/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Derrida: deconstruction and différance",
        [
          {
            "title": "Jacques Derrida (SEP)",
            "url": "https://plato.stanford.edu/entries/derrida/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Derrida, Jacques (IEP)",
            "url": "https://iep.utm.edu/derrida/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Lyotard: the postmodern condition and the end of grand narratives",
        [
          {
            "title": "Jean François Lyotard (SEP)",
            "url": "https://plato.stanford.edu/entries/lyotard/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Postmodernism (SEP)",
            "url": "https://plato.stanford.edu/entries/postmodernism/",
            "note": "Stanford Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Lyotard, Jean-François (IEP)",
            "url": "https://iep.utm.edu/lyotard/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ],
      [
        "Looking back: what the continental line settled and left open",
        [
          {
            "title": "Phenomenology (IEP)",
            "url": "https://iep.utm.edu/phenom/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Existentialism (IEP)",
            "url": "https://iep.utm.edu/existent/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          },
          {
            "title": "Frankfurt School and Critical Theory (IEP)",
            "url": "https://iep.utm.edu/frankfur/",
            "note": "Internet Encyclopedia of Philosophy. Free."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 14 · Philosophy now",
    "lessons": [
      [
        "Context: philosophy after 1945 and the return of the big questions",
        [
          {
            "title": "SEP: Distributive Justice",
            "url": "https://plato.stanford.edu/entries/justice-distributive/",
            "note": "Stanford Encyclopedia of Philosophy, free. Shows the post-1971 landscape of political philosophy."
          },
          {
            "title": "SEP: The Epistemology of Religion",
            "url": "https://plato.stanford.edu/entries/religion-epistemology/",
            "note": "Stanford Encyclopedia of Philosophy, free. Background to the revival of philosophy of religion."
          }
        ]
      ],
      [
        "Rawls: the original position and the veil of ignorance",
        [
          {
            "title": "SEP: Original Position",
            "url": "https://plato.stanford.edu/entries/original-position/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: John Rawls",
            "url": "https://plato.stanford.edu/entries/rawls/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Rawls: the two principles, the difference principle and political liberalism",
        [
          {
            "title": "SEP: John Rawls",
            "url": "https://plato.stanford.edu/entries/rawls/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: John Rawls",
            "url": "https://iep.utm.edu/rawls/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Nozick: the Wilt Chamberlain argument and the experience machine",
        [
          {
            "title": "SEP: Robert Nozick's Political Philosophy",
            "url": "https://plato.stanford.edu/entries/nozick-political/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Hedonism",
            "url": "https://plato.stanford.edu/entries/hedonism/",
            "note": "Stanford Encyclopedia of Philosophy, free. Discusses the experience machine objection."
          },
          {
            "title": "IEP: Robert Nozick",
            "url": "https://iep.utm.edu/nozick/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "The communitarians: Sandel, Taylor and Walzer against the unencumbered self",
        [
          {
            "title": "SEP: Communitarianism",
            "url": "https://plato.stanford.edu/entries/communitarianism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Reading: the Declaration of Independence on self-evident rights",
        [
          {
            "title": "The Declaration of Independence of the United States of America (Project Gutenberg eBook no. 1)",
            "url": "https://www.gutenberg.org/ebooks/1",
            "note": "Public domain, Project Gutenberg. The text quoted in the lesson."
          },
          {
            "title": "SEP: The Natural Law Tradition in Ethics",
            "url": "https://plato.stanford.edu/entries/natural-law-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Anscombe: 'Modern Moral Philosophy' and the law conception of ethics",
        [
          {
            "title": "SEP: Gertrude Elizabeth Margaret Anscombe",
            "url": "https://plato.stanford.edu/entries/anscombe/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: G. E. M. Anscombe",
            "url": "https://iep.utm.edu/anscombe/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "MacIntyre's After Virtue and the revival of virtue ethics",
        [
          {
            "title": "SEP: Virtue Ethics",
            "url": "https://plato.stanford.edu/entries/ethics-virtue/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: Alasdair MacIntyre",
            "url": "https://iep.utm.edu/mac-over/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: Virtue Ethics",
            "url": "https://iep.utm.edu/virtue/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Foot and Thomson: the trolley problem and the doctrine of double effect",
        [
          {
            "title": "SEP: Doctrine of Double Effect",
            "url": "https://plato.stanford.edu/entries/double-effect/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Parfit on personal identity: why identity is not what matters",
        [
          {
            "title": "SEP: Personal Identity",
            "url": "https://plato.stanford.edu/entries/identity-personal/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Parfit's repugnant conclusion and population ethics",
        [
          {
            "title": "SEP: The Repugnant Conclusion",
            "url": "https://plato.stanford.edu/entries/repugnant-conclusion/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: The Nonidentity Problem",
            "url": "https://plato.stanford.edu/entries/nonidentity-problem/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Singer: 'Famine, Affluence, and Morality' and the drowning child",
        [
          {
            "title": "Utilitarianism.net: Study Guide to Peter Singer's 'Famine, Affluence, and Morality'",
            "url": "https://www.utilitarianism.net/peter-singer-famine-affluence-and-morality/",
            "note": "Free study guide setting out the argument and objections."
          }
        ]
      ],
      [
        "Singer on animals, effective altruism and its critics",
        [
          {
            "title": "SEP: The Moral Status of Animals",
            "url": "https://plato.stanford.edu/entries/moral-animal/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Introduction to Effective Altruism (effectivealtruism.org)",
            "url": "https://www.effectivealtruism.org/articles/introduction-to-effective-altruism",
            "note": "The movement's own introduction, free; read with the critics in the lesson in mind."
          }
        ]
      ],
      [
        "Plantinga's reformed epistemology: belief in God as properly basic",
        [
          {
            "title": "IEP: Reformed Epistemology",
            "url": "https://iep.utm.edu/ref-epis/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: The Epistemology of Religion",
            "url": "https://plato.stanford.edu/entries/religion-epistemology/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "The problem of evil: Mackie, Plantinga's free will defence and Rowe",
        [
          {
            "title": "SEP: The Problem of Evil",
            "url": "https://plato.stanford.edu/entries/evil/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: The Logical Problem of Evil",
            "url": "https://iep.utm.edu/evil-log/",
            "note": "Internet Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: The Evidential Problem of Evil",
            "url": "https://iep.utm.edu/evil-evi/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Swinburne, Craig's Kalam argument and fine-tuning",
        [
          {
            "title": "SEP: Cosmological Argument",
            "url": "https://plato.stanford.edu/entries/cosmological-argument/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Fine-Tuning",
            "url": "https://plato.stanford.edu/entries/fine-tuning/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: Design Arguments for the Existence of God",
            "url": "https://iep.utm.edu/design-arguments-for-existence-of-god/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Consciousness: Nagel's bat, Jackson's Mary and Chalmers's hard problem",
        [
          {
            "title": "SEP: Qualia: The Knowledge Argument",
            "url": "https://plato.stanford.edu/entries/qualia-knowledge/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Zombies",
            "url": "https://plato.stanford.edu/entries/zombies/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "IEP: Hard Problem of Consciousness",
            "url": "https://iep.utm.edu/hard-problem-of-conciousness/",
            "note": "Internet Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Consciousness after the hard problem: illusionism and panpsychism",
        [
          {
            "title": "SEP: Panpsychism",
            "url": "https://plato.stanford.edu/entries/panpsychism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Consciousness",
            "url": "https://plato.stanford.edu/entries/consciousness/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: The Neuroscience of Consciousness",
            "url": "https://plato.stanford.edu/entries/consciousness-neuroscience/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Free will now: Frankfurt cases, compatibilism and the neuroscience",
        [
          {
            "title": "SEP: Moral Responsibility and the Principle of Alternative Possibilities",
            "url": "https://plato.stanford.edu/entries/alternative-possibilities/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Compatibilism",
            "url": "https://plato.stanford.edu/entries/compatibilism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Free Will",
            "url": "https://plato.stanford.edu/entries/freewill/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Metaethics: moral realism, Mackie's error theory and expressivism",
        [
          {
            "title": "SEP: Moral Realism",
            "url": "https://plato.stanford.edu/entries/moral-realism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Moral Anti-Realism",
            "url": "https://plato.stanford.edu/entries/moral-anti-realism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Moral Cognitivism vs. Non-Cognitivism",
            "url": "https://plato.stanford.edu/entries/moral-cognitivism/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Feminist philosophy: care, justice and epistemic injustice",
        [
          {
            "title": "SEP: Feminist Ethics",
            "url": "https://plato.stanford.edu/entries/feminism-ethics/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Feminist Epistemology and Philosophy of Science",
            "url": "https://plato.stanford.edu/entries/feminism-epistemology/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Feminist Perspectives on Sex and Gender",
            "url": "https://plato.stanford.edu/entries/feminism-gender/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Experimental philosophy: the Knobe effect and the trouble with intuitions",
        [
          {
            "title": "SEP: Experimental Philosophy",
            "url": "https://plato.stanford.edu/entries/experimental-philosophy/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ],
      [
        "Minds, machines and AI, as of November 2026",
        [
          {
            "title": "SEP: The Chinese Room Argument",
            "url": "https://plato.stanford.edu/entries/chinese-room/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "Chalmers, 'Could a Large Language Model be Conscious?' (arXiv, 2023)",
            "url": "https://arxiv.org/abs/2303.07103",
            "note": "Free preprint by David Chalmers."
          },
          {
            "title": "Butlin, Long et al., 'Consciousness in Artificial Intelligence: Insights from the Science of Consciousness' (arXiv, 2023)",
            "url": "https://arxiv.org/abs/2308.08708",
            "note": "Free preprint; the indicator-properties report."
          }
        ]
      ],
      [
        "Looking back: what philosophy now has settled and left open",
        [
          {
            "title": "SEP: The Turing Test",
            "url": "https://plato.stanford.edu/entries/turing-test/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          },
          {
            "title": "SEP: Virtue Ethics",
            "url": "https://plato.stanford.edu/entries/ethics-virtue/",
            "note": "Stanford Encyclopedia of Philosophy, free."
          }
        ]
      ]
    ]
  }
];

const out = [
  '-- Generated by scripts/curriculums/philosophy.mjs. Read before running.',
  '-- Apply it with `npm run curriculum philosophy`, which carries ticks,',
  "-- detail typed at the dashboard and every card's review history across the",
  '-- rebuild below. Running this file through wrangler by hand discards them.',
  // Rebuildable without losing its place: the row is created only if it is not
  // already there, and its modules are cleared instead. Deleting the curriculum
  // and reinserting it would take a new position at the end, and curriculum
  // order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at)\n` +
    `  select ${q(NAME)}, ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(NOW)}\n` +
    `  where not exists (select 1 from curriculums where name = ${q(NAME)});`,
  `update curriculums set source = ${q(SOURCE)} where name = ${q(NAME)};`,

  // Lesson-scoped sources are the script's own and go before the lessons do.
  // ON DELETE CASCADE would cover it wherever foreign keys are enforced -- D1
  // enforces them, node:sqlite does not -- so it is written out rather than
  // relied upon. The curriculum's own list, where lesson_id is null, is NOT
  // touched: nothing could regenerate it. See migration 0009.
  `delete from sources where lesson_id is not null and curriculum_id = ${CURRICULUM};`,

  // Lessons, then modules. Same reasoning.
  `delete from lessons where module_id in\n` +
    `  (select id from modules where curriculum_id = ${CURRICULUM});`,
  `delete from modules where curriculum_id = ${CURRICULUM};`,
  '',
  '-- CARDS ARE NEVER DELETED HERE. A card carries months of review history and',
  '-- no script can regenerate that, so the rebuild above sets lesson_id to null',
  '-- (migration 0010) and each card is matched again below by its natural key:',
  '-- curriculum, kind and front. Insert what is new, update what exists, and',
  '-- leave every scheduling column alone.',
];

stages.forEach((stage, m) => {
  out.push(
    '',
    `-- ${stage.name}`,
    `insert into modules (curriculum_id, name, position)\n` +
      `  values (${CURRICULUM}, ${q(stage.name)}, ${m + 1});`,
  );

  stage.lessons.forEach((lesson, l) => {
    const name = nameOf(lesson);
    out.push(
      `insert into lessons (module_id, name, position, on_route, detail)\n` +
        `  values ((select max(id) from modules), ${q(name)}, ${l + 1}, 1, ${q(detailFor(name))});`,
    );

    sourcesOf(lesson).forEach((source, s) => {
      out.push(
        `insert into sources (curriculum_id, lesson_id, title, url, note, position)\n` +
          `  values (${CURRICULUM}, ${LESSON}, ${q(source.title)}, ${q(source.url ?? null)},` +
          ` ${q(source.note ?? null)}, ${s + 1});`,
      );
    });

    for (const card of cardsFor(name)) {
      const identity =
        `curriculum_id = ${CURRICULUM} and kind = ${q(card.kind)} and front = ${q(card.front)}`;
      out.push(
        `insert into cards (curriculum_id, lesson_id, kind, front, back, reading, extra,\n` +
          `                   due, stability, difficulty, scheduled_days, learning_steps,\n` +
          `                   reps, lapses, state, last_review, unlocked_on, created_at)\n` +
          `  select ${CURRICULUM}, ${LESSON}, ${q(card.kind)}, ${q(card.front)}, ${q(card.back)},\n` +
          `         ${q(card.reading ?? null)}, ${q(card.extra ?? null)}, ${q(NOW)},\n` +
          `         0, 0, 0, 0, 0, 0, 0, null, null, ${q(NOW)}\n` +
          `  where not exists (select 1 from cards where ${identity});`,
        // Content and the lesson link are the script's; scheduling and
        // unlocked_on are the dashboard's and are not named here.
        `update cards set lesson_id = ${LESSON}, back = ${q(card.back)},\n` +
          `       reading = ${q(card.reading ?? null)}, extra = ${q(card.extra ?? null)}\n` +
          ` where ${identity};`,
      );
    }
  });
});

const strayDetail = Object.keys(detail).filter((key) => !askedDetail.has(key));
const strayCards = Object.keys(cards).filter((key) => !askedCards.has(key));

if (twiceClaimed.length) {
  console.error(`\n${twiceClaimed.length} card(s) are claimed by two lessons:`);
  for (const [front, first, second] of twiceClaimed) {
    console.error(`  · ${front}  —  ${first}  and  ${second}`);
  }
  console.error('\nA card belongs to one lesson. Nothing printed.');
  process.exit(1);
}

if (missing.length) {
  console.error(`\nNo material for ${missing.length} lesson(s):`);
  for (const name of missing) console.error(`  · ${name}`);
  console.error('\nEvery lesson teaches its point in full. Nothing printed.');
  process.exit(1);
}
for (const key of strayDetail) console.error(`! philosophy-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! philosophy-cards.json has no lesson: ${key}`);

console.log(out.join('\n'));

const lessons = stages.reduce((n, s) => n + s.lessons.length, 0);
const sources = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, lesson) => k + sourcesOf(lesson).length, 0),
  0,
);
const cardCount = stages.reduce(
  (n, s) => n + s.lessons.reduce((k, lesson) => k + (cards[nameOf(lesson)]?.length ?? 0), 0),
  0,
);
console.error(
  `modules: ${stages.length}  lessons: ${lessons}  cards: ${cardCount}  lesson sources: ${sources}`,
);
