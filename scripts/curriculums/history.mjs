// History — a world survey, from the first humans to now, in the order it
// happened and every region in each age. The plan and every ruling are in
// scripts/curriculums/history.md; this file is the structure. The material is
// in history-detail.json and the cards in history-cards.json, keyed by lesson
// name.
//
//   npm run curriculum history          # the live database
//
// THE RULE FOR THIS ONE: OpenStax World History is the order followed and the
// further reading, never text adapted (CC BY-NC-SA, and OpenStax asks that it
// not be used with AI). Lessons are written fresh. Where historians disagree,
// the lesson gives the strongest form of each reading and what would settle
// it. Built a stage at a time; only what is written is here.

import detail from './history-detail.json' with { type: 'json' };
import cards from './history-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/history.md';
const NAME = 'History';

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
    "name": "Stage 1 · How history is known, and the first humans",
    "lessons": [
      [
        "What history is",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 1: Understanding the Past",
            "url": "https://openstax.org/books/world-history-volume-1/pages/1-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Herodotus, The History, tr. G. C. Macaulay (1890), vol. 1",
            "url": "https://www.gutenberg.org/ebooks/2707",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "The world at a glance",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 1: Understanding the Past",
            "url": "https://openstax.org/books/world-history-volume-1/pages/1-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Evidence: primary and secondary sources",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 1: Understanding the Past",
            "url": "https://openstax.org/books/world-history-volume-1/pages/1-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet Ancient History Sourcebook (Fordham)",
            "url": "https://sourcebooks.fordham.edu/ancient/asbook.asp",
            "note": "Free primary sources, by period."
          }
        ]
      ],
      [
        "Primary source: Herodotus says why he wrote",
        [
          {
            "title": "Herodotus, The History, tr. G. C. Macaulay (1890), vol. 1",
            "url": "https://www.gutenberg.org/ebooks/2707",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Counting years: BC, AD, BCE and CE",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 1: Understanding the Past",
            "url": "https://openstax.org/books/world-history-volume-1/pages/1-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Dating without writing: layers, tree rings and radiocarbon",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          }
        ]
      ],
      [
        "Why things happen: cause, consequence and chance",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 1: Understanding the Past",
            "url": "https://openstax.org/books/world-history-volume-1/pages/1-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "When historians disagree",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 1: Understanding the Past",
            "url": "https://openstax.org/books/world-history-volume-1/pages/1-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Deep time: the Earth and the first hominins",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Standing up: the australopithecines",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The first tools",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Homo erectus and the first journeys out of Africa",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Fire",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          }
        ]
      ],
      [
        "Our cousins: Neanderthals, Denisovans and the rest",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Homo sapiens in Africa",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The first symbols: Blombos and the beads",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Out of Africa: the great dispersal",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The Ice Age world",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Into Australia and the Americas",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "How hunter-gatherers lived",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Khan Academy, World History",
            "url": "https://www.khanacademy.org/humanities/world-history",
            "note": "Free overview videos."
          }
        ]
      ],
      [
        "Cave art and the first figurines",
        [
          {
            "title": "Smithsonian Human Origins Program",
            "url": "https://humanorigins.si.edu/",
            "note": "Free. The species, the fossils and the evidence, by the National Museum of Natural History."
          },
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Connections: the world at the end of the Ice Age",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 2: Early Humans",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Khan Academy, World History",
            "url": "https://www.khanacademy.org/humanities/world-history",
            "note": "Free overview videos."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 2 · The first farmers and the first cities",
    "lessons": [
      [
        "Map: the world as the ice melted, about 10,000 BC",
        [
          {
            "title": "OpenStax World History Vol. 1, 2.3 The Neolithic Revolution",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-3-the-neolithic-revolution",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "Our World in Data: population",
            "url": "https://ourworldindata.org/grapher/population",
            "note": "Long-run population estimates, with their sources; CC BY."
          }
        ]
      ],
      [
        "Why people started farming: the rival explanations",
        [
          {
            "title": "Smithsonian Human Origins: Humans Change the World",
            "url": "https://humanorigins.si.edu/human-characteristics/humans-change-world",
            "note": "Free. The shift to farming and its effects."
          },
          {
            "title": "Peter Bellwood, First Farmers: The Origins of Agricultural Societies (2005)",
            "note": "Printed book, by Peter Bellwood: the independent centres and how farming spread."
          }
        ]
      ],
      [
        "The Natufians and the first farms of the Fertile Crescent",
        [
          {
            "title": "OpenStax World History Vol. 1, 2.3 The Neolithic Revolution",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-3-the-neolithic-revolution",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "World History Encyclopedia: Neolithic",
            "url": "https://www.worldhistory.org/Neolithic/",
            "note": "Free overview of the period."
          }
        ]
      ],
      [
        "Göbekli Tepe: monuments before farming",
        [
          {
            "title": "World History Encyclopedia: Göbekli Tepe",
            "url": "https://www.worldhistory.org/Gobekli_Tepe/",
            "note": "Free. Read alongside the lesson's account of the revised, settlement reading."
          },
          {
            "title": "Klaus Schmidt, Göbekli Tepe: A Stone Age Sanctuary in South-Eastern Anatolia (2012)",
            "note": "Printed book, by the excavator: the 'temple first' case in his own words."
          }
        ]
      ],
      [
        "Jericho and Çatalhöyük: the first big villages",
        [
          {
            "title": "World History Encyclopedia: Jericho",
            "url": "https://www.worldhistory.org/jericho/",
            "note": "Free."
          },
          {
            "title": "World History Encyclopedia: Çatalhöyük",
            "url": "https://www.worldhistory.org/Catalhoyuk/",
            "note": "Free."
          },
          {
            "title": "Ian Hodder, The Leopard's Tale: Revealing the Mysteries of Çatalhöyük (2006)",
            "note": "Printed book, by Ian Hodder, director of the 1993–2017 excavations."
          }
        ]
      ],
      [
        "Taming animals: dogs, sheep, goats, cattle and pigs",
        [
          {
            "title": "World History Encyclopedia: Domestication",
            "url": "https://www.worldhistory.org/Domestication/",
            "note": "Free overview of plant and animal domestication."
          },
          {
            "title": "David W. Anthony, The Horse, the Wheel, and Language (2007)",
            "note": "Printed book, by David Anthony: herding, the horse and the steppe; written before the 2021 horse DNA results."
          }
        ]
      ],
      [
        "China's two farmings: northern millet and southern rice",
        [
          {
            "title": "OpenStax World History Vol. 1, 5.1 Ancient China",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-1-ancient-china",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "Li Liu and Xingcan Chen, The Archaeology of China: From the Late Paleolithic to the Early Bronze Age (2012)",
            "note": "Printed book, by Li Liu and Xingcan Chen: the standard archaeological survey in English."
          }
        ]
      ],
      [
        "New Guinea's Kuk Swamp: farming in the highlands",
        [
          {
            "title": "OpenStax World History Vol. 1, 2.3 The Neolithic Revolution",
            "url": "https://openstax.org/books/world-history-volume-1/pages/2-3-the-neolithic-revolution",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "Peter Bellwood, First Farmers (2005)",
            "note": "Printed book, by Peter Bellwood: includes the New Guinea centre and the Austronesian spread."
          }
        ]
      ],
      [
        "Maize from teosinte: farming in Mesoamerica",
        [
          {
            "title": "OpenStax World History Vol. 1, 8.1 Populating and Settling the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-1-populating-and-settling-the-americas",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "World History Encyclopedia: Maize",
            "url": "https://www.worldhistory.org/Maize/",
            "note": "Free."
          }
        ]
      ],
      [
        "The Andes and Amazonia: potatoes, llamas and manioc",
        [
          {
            "title": "OpenStax World History Vol. 1, 8.2 Early Cultures and Civilizations in the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-2-early-cultures-and-civilizations-in-the-americas",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "Barnhart, Ancient Civilizations of North America",
            "note": ". For North America's ancient peoples, including the eastern woodlands."
          }
        ]
      ],
      [
        "Africa's own farmers: the green Sahara, the Sahel and Ethiopia",
        [
          {
            "title": "OpenStax World History Vol. 1, 9.1 Africa's Geography and Climate",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-1-africas-geography-and-climate",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "OpenStax World History Vol. 1, 9.2 The Emergence of Farming and the Bantu Migrations",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-2-the-emergence-of-farming-and-the-bantu-migrations",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          }
        ]
      ],
      [
        "Farmers on the move: the Neolithic reaches Europe and South Asia",
        [
          {
            "title": "Smithsonian Human Origins: Ancient DNA",
            "url": "https://humanorigins.si.edu/evidence/genetics/ancient-dna-and-neanderthals",
            "note": "Free. How ancient DNA is read; background to the migration findings."
          },
          {
            "title": "David Reich, Who We Are and How We Got Here (2018)",
            "note": "Printed book, by the geneticist David Reich: the ancient-DNA evidence for farmer and steppe migrations, Europe and India."
          }
        ]
      ],
      [
        "The price of farming: health, work and inequality",
        [
          {
            "title": "James C. Scott, Against the Grain: A Deep History of the Earliest States (2017)",
            "note": "Printed book, by James C. Scott: the critical case."
          },
          {
            "title": "Smithsonian Human Origins: Humans Change the World",
            "url": "https://humanorigins.si.edu/human-characteristics/humans-change-world",
            "note": "Free."
          }
        ]
      ],
      [
        "Copper, megaliths and the steppe: Europe and Eurasia, 5000–2500 BC",
        [
          {
            "title": "English Heritage: History of Stonehenge",
            "url": "https://www.english-heritage.org.uk/visit/places/stonehenge/history-and-stories/history/",
            "note": "Free. The building phases and what they mean."
          },
          {
            "title": "World History Encyclopedia: Stonehenge",
            "url": "https://www.worldhistory.org/Stonehenge/",
            "note": "Free."
          },
          {
            "title": "David W. Anthony, The Horse, the Wheel, and Language (2007)",
            "note": "Printed book, by David Anthony: the steppe hypothesis in full."
          }
        ]
      ],
      [
        "Uruk: the first city",
        [
          {
            "title": "OpenStax World History Vol. 1, 3.2 Ancient Mesopotamia",
            "url": "https://openstax.org/books/world-history-volume-1/pages/3-2-ancient-mesopotamia",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "World History Encyclopedia: Uruk",
            "url": "https://www.worldhistory.org/uruk/",
            "note": "Free."
          },
          {
            "title": "Marc Van De Mieroop, A History of the Ancient Near East (3rd ed., 2016)",
            "note": "Printed book, by Marc Van De Mieroop: the standard textbook, from Uruk on."
          }
        ]
      ],
      [
        "From tokens to cuneiform: writing in Sumer",
        [
          {
            "title": "Cuneiform Digital Library Initiative",
            "url": "https://cdli.mpiwg-berlin.mpg.de/",
            "note": "Free. Photographs and transliterations of hundreds of thousands of tablets, including the archaic Uruk texts."
          },
          {
            "title": "World History Encyclopedia: Cuneiform",
            "url": "https://www.worldhistory.org/cuneiform/",
            "note": "Free."
          }
        ]
      ],
      [
        "The Sumerian city-states: temples, ziggurats and kings",
        [
          {
            "title": "Internet Ancient History Sourcebook: Mesopotamia",
            "url": "https://sourcebooks.fordham.edu/ancient/asbook03.asp",
            "note": "Free. Links to Sumerian texts, including the Umma–Lagash inscriptions and the King List."
          },
          {
            "title": "The Sumerian King List (ETCSL translation)",
            "url": "https://etcsl.orinst.ox.ac.uk/section2/tr211.htm",
            "note": "Free to read; Oxford's Electronic Text Corpus of Sumerian Literature."
          },
          {
            "title": "World History Encyclopedia: Ziggurat",
            "url": "https://www.worldhistory.org/Ziggurat/",
            "note": "Free."
          }
        ]
      ],
      [
        "Primary source: Gilgamesh, and the wild man who learned to eat bread",
        [
          {
            "title": "Jastrow and Clay, An Old Babylonian Version of the Gilgamesh Epic (1920), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/11000",
            "note": "Public domain. The source of the passage; the Pennsylvania tablet, column III."
          },
          {
            "title": "World History Encyclopedia: Gilgamesh",
            "url": "https://www.worldhistory.org/Gilgamesh/",
            "note": "Free. The historical king and the versions of the epic."
          }
        ]
      ],
      [
        "Egypt unified: Naqada, Narmer and the first dynasties",
        [
          {
            "title": "OpenStax World History Vol. 1, 3.3 Ancient Egypt",
            "url": "https://openstax.org/books/world-history-volume-1/pages/3-3-ancient-egypt",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "World History Encyclopedia: Narmer Palette",
            "url": "https://www.worldhistory.org/Narmer_Palette/",
            "note": "Free."
          },
          {
            "title": "Toby Wilkinson, Early Dynastic Egypt (1999)",
            "note": "Printed book, by Toby Wilkinson: the formation of the state in detail."
          }
        ]
      ],
      [
        "The Old Kingdom: the god-king and the first pyramids",
        [
          {
            "title": "World History Encyclopedia: Old Kingdom of Egypt",
            "url": "https://www.worldhistory.org/Old_Kingdom_of_Egypt/",
            "note": "Free."
          },
          {
            "title": "Internet Ancient History Sourcebook: Egypt",
            "url": "https://sourcebooks.fordham.edu/ancient/asbook04.asp",
            "note": "Free. Links to Old Kingdom texts, including the Pyramid Texts."
          },
          {
            "title": "Barry Kemp, Ancient Egypt: Anatomy of a Civilization (2nd ed., 2006)",
            "note": "Printed book, by Barry Kemp: how the Egyptian state worked."
          }
        ]
      ],
      [
        "Giza: how the Great Pyramid was built, and by whom",
        [
          {
            "title": "World History Encyclopedia: Great Pyramid of Giza",
            "url": "https://www.worldhistory.org/Great_Pyramid_of_Giza/",
            "note": "Free."
          },
          {
            "title": "Pierre Tallet and Mark Lehner, The Red Sea Scrolls (2021)",
            "note": "Printed book, by Pierre Tallet and Mark Lehner: the Wadi al-Jarf papyri and the Diary of Merer."
          },
          {
            "title": "Mark Lehner, The Complete Pyramids (1997)",
            "note": "Printed book, by Mark Lehner: every pyramid, and the building methods."
          }
        ]
      ],
      [
        "Writing invented more than once",
        [
          {
            "title": "World History Encyclopedia: Writing",
            "url": "https://www.worldhistory.org/Writing/",
            "note": "Free."
          },
          {
            "title": "Andrew Robinson, The Story of Writing (2nd ed., 2007)",
            "note": "Printed book, by Andrew Robinson: the scripts of the world and their decipherment."
          }
        ]
      ],
      [
        "The Indus cities: Harappa, Mohenjo-daro and Dholavira",
        [
          {
            "title": "OpenStax World History Vol. 1, 3.4 The Indus Valley Civilization",
            "url": "https://openstax.org/books/world-history-volume-1/pages/3-4-the-indus-valley-civilization",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "World History Encyclopedia: Mohenjo-daro",
            "url": "https://www.worldhistory.org/Mohenjo-daro/",
            "note": "Free."
          },
          {
            "title": "Jonathan Mark Kenoyer, Ancient Cities of the Indus Valley Civilization (1998)",
            "note": "Printed book, by J. M. Kenoyer, a long-serving excavator at Harappa."
          }
        ]
      ],
      [
        "The Indus puzzles: an unread script and the abandoned cities",
        [
          {
            "title": "World History Encyclopedia: Indus Script",
            "url": "https://www.worldhistory.org/Indus_Script/",
            "note": "Free."
          },
          {
            "title": "World History Encyclopedia: Indus Valley Civilization",
            "url": "https://www.worldhistory.org/Indus_Valley_Civilization/",
            "note": "Free."
          },
          {
            "title": "Fisher, History of India",
            "note": ". Its opening chapters on the Indus."
          }
        ]
      ],
      [
        "Before the Shang: Longshan towns, Taosi and Erlitou",
        [
          {
            "title": "World History Encyclopedia: Liangzhu Culture",
            "url": "https://www.worldhistory.org/Liangzhu_Culture/",
            "note": "Free."
          },
          {
            "title": "World History Encyclopedia: Xia Dynasty",
            "url": "https://www.worldhistory.org/Xia_Dynasty/",
            "note": "Free. Read for the tradition; the lesson gives the debate."
          },
          {
            "title": "Li Liu and Xingcan Chen, The Archaeology of China (2012)",
            "note": "Printed book, by Li Liu and Xingcan Chen: Longshan, Taosi and Erlitou in detail."
          }
        ]
      ],
      [
        "Caral and Norte Chico: the first towns of the Americas",
        [
          {
            "title": "OpenStax World History Vol. 1, 8.2 Early Cultures and Civilizations in the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-2-early-cultures-and-civilizations-in-the-americas",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "Michael E. Moseley, The Incas and Their Ancestors (rev. ed., 2001)",
            "note": "Printed book, by Michael Moseley, author of the 'maritime foundations' thesis."
          }
        ]
      ],
      [
        "Sargon of Akkad: the first empire",
        [
          {
            "title": "The Legend of Sargon of Akkadê (Internet Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/2300sargon1.asp",
            "note": "Free. The later birth legend; read as legend, not record."
          },
          {
            "title": "The Sargon legend (ETCSL translation)",
            "url": "https://etcsl.orinst.ox.ac.uk/section2/tr214.htm",
            "note": "Free to read. The Sumerian story of Sargon the cupbearer."
          },
          {
            "title": "The exaltation of Inana (ETCSL translation)",
            "url": "https://etcsl.orinst.ox.ac.uk/section4/tr4072.htm",
            "note": "Free to read. The hymn attributed to Enheduanna."
          }
        ]
      ],
      [
        "The crisis around 2200 BC: drought, the Gutians and the end of the Old Kingdom",
        [
          {
            "title": "The cursing of Agade (ETCSL translation)",
            "url": "https://etcsl.orinst.ox.ac.uk/section2/tr215.htm",
            "note": "Free to read. The Sumerian explanation of Akkad's fall."
          },
          {
            "title": "The lament for Urim (ETCSL translation)",
            "url": "https://etcsl.orinst.ox.ac.uk/section2/tr222.htm",
            "note": "Free to read. The lament for the fall of Ur, 2004 BC."
          },
          {
            "title": "World History Encyclopedia: Third Dynasty of Ur",
            "url": "https://www.worldhistory.org/Third_Dynasty_of_Ur/",
            "note": "Free."
          }
        ]
      ],
      [
        "Connections: the world of 2000 BC",
        [
          {
            "title": "OpenStax World History Vol. 1, 3.1 Early Civilizations",
            "url": "https://openstax.org/books/world-history-volume-1/pages/3-1-early-civilizations",
            "note": "Further reading only; CC BY-NC-SA, not adapted."
          },
          {
            "title": "World History Encyclopedia: Kerma",
            "url": "https://www.worldhistory.org/Kerma/",
            "note": "Free. Nubia's kingdom, Egypt's southern rival."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 3 · Bronze Age empires, 2000–1000 BC",
    "lessons": [
      [
        "Map: the world around 2000 BC",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 4: The Near East (introduction)",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-introduction",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "The Ancient Near East, c. 3000–330 BC",
            "note": "Amélie Kuhrt (1995), 2 vols. The standard survey of the region in this age."
          }
        ]
      ],
      [
        "Horse, chariot and the Indo-European languages",
        [
          {
            "title": "OpenStax, World History Vol. 1, 5.2: The Steppes",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-2-the-steppes",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Indo-European Languages",
            "url": "https://www.worldhistory.org/Indo-European_Languages/",
            "note": "Free overview of the family and its branches."
          },
          {
            "title": "The Horse, the Wheel, and Language",
            "note": "David W. Anthony (2007). The case for the steppe hypothesis, from archaeology."
          }
        ]
      ],
      [
        "Egypt's Middle Kingdom, about 2055–1650 BC",
        [
          {
            "title": "OpenStax, World History Vol. 1, 3.3: Ancient Egypt",
            "url": "https://openstax.org/books/world-history-volume-1/pages/3-3-ancient-egypt",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Middle Kingdom of Egypt",
            "url": "https://www.worldhistory.org/Middle_Kingdom_of_Egypt/",
            "note": "Free overview, kings and literature."
          }
        ]
      ],
      [
        "Hammurabi and Old Babylon",
        [
          {
            "title": "OpenStax, World History Vol. 1, 4.1: From Old Babylon to the Medes",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-1-from-old-babylon-to-the-medes",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Hammurabi",
            "url": "https://www.worldhistory.org/Hammurabi/",
            "note": "Free overview of the reign."
          },
          {
            "title": "The City of Babylon: A History, c. 2000 BC – AD 116",
            "note": "Stephanie Dalley (2021). the city from Hammurabi on."
          }
        ]
      ],
      [
        "Primary source: Hammurabi's laws on eyes, bones and builders",
        [
          {
            "title": "Fordham Ancient History Sourcebook: Code of Hammurabi (L. W. King translation)",
            "url": "https://sourcebooks.fordham.edu/ancient/hamcode.asp",
            "note": "The full text quoted in the lesson, with old commentary by Horne and Johns."
          },
          {
            "title": "Wikisource: Codex Hammurabi (King translation, 1903)",
            "url": "https://en.wikisource.org/wiki/Codex_Hammurabi_(King_translation)",
            "note": "The same translation, public domain; used to cross-check the quoted words."
          },
          {
            "title": "Louvre: the Code of Hammurabi stele",
            "url": "https://collections.louvre.fr/en/ark:/53355/cl010174436",
            "note": "The museum's record of the stele itself, with photographs."
          }
        ]
      ],
      [
        "Kerma: the kingdom of Kush that rivalled Egypt",
        [
          {
            "title": "OpenStax, World History Vol. 1, 9.3: The Kingdom of Kush",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-3-the-kingdom-of-kush",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Kerma",
            "url": "https://www.worldhistory.org/Kerma/",
            "note": "Free overview of the site and kingdom."
          }
        ]
      ],
      [
        "The Hyksos: foreign kings in the Nile Delta",
        [
          {
            "title": "World History Encyclopedia: Hyksos",
            "url": "https://www.worldhistory.org/hyksos/",
            "note": "Free overview, including the invasion debate."
          },
          {
            "title": "World History Encyclopedia: Second Intermediate Period of Egypt",
            "url": "https://www.worldhistory.org/Second_Intermediate_Period_of_Egypt/",
            "note": "The wider period, from the 13th Dynasty to Ahmose."
          }
        ]
      ],
      [
        "The Hittites of Hattusa",
        [
          {
            "title": "World History Encyclopedia: Hittites",
            "url": "https://www.worldhistory.org/Hittites/",
            "note": "Free overview of the kingdom."
          },
          {
            "title": "World History Encyclopedia: Hattusa",
            "url": "https://www.worldhistory.org/Hattusa/",
            "note": "The capital and its archive."
          },
          {
            "title": "The Kingdom of the Hittites",
            "note": "Trevor Bryce (new edition 2005). The standard history."
          }
        ]
      ],
      [
        "Mitanni, the Kassites and the rise of Assyria",
        [
          {
            "title": "World History Encyclopedia: Mitanni",
            "url": "https://www.worldhistory.org/Mitanni/",
            "note": "Free overview."
          },
          {
            "title": "World History Encyclopedia: Kassites",
            "url": "https://www.worldhistory.org/Kassites/",
            "note": "The Kassite dynasty of Babylon."
          },
          {
            "title": "World History Encyclopedia: Assyria",
            "url": "https://www.worldhistory.org/Assyria/",
            "note": "Assyria from the merchant city to the empire."
          }
        ]
      ],
      [
        "Egypt's New Kingdom builds an empire",
        [
          {
            "title": "OpenStax, World History Vol. 1, 4.2: Egypt's New Kingdom",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-2-egypts-new-kingdom",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Thutmose III",
            "url": "https://www.worldhistory.org/Thutmose_III/",
            "note": "Includes the Battle of Megiddo."
          }
        ]
      ],
      [
        "Hatshepsut, the woman who ruled as king",
        [
          {
            "title": "World History Encyclopedia: Hatshepsut",
            "url": "https://www.worldhistory.org/Hatshepsut/",
            "note": "Free overview of the reign and the erasure."
          },
          {
            "title": "OpenStax, World History Vol. 1, 4.2: Egypt's New Kingdom",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-2-egypts-new-kingdom",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          }
        ]
      ],
      [
        "Akhenaten, the Aten and the city of Amarna",
        [
          {
            "title": "World History Encyclopedia: Akhenaten",
            "url": "https://www.worldhistory.org/Akhenaten/",
            "note": "Free overview of the reign and the religion."
          },
          {
            "title": "World History Encyclopedia: Amarna",
            "url": "https://www.worldhistory.org/Amarna/",
            "note": "The city and its excavation."
          },
          {
            "title": "World History Encyclopedia: Tutankhamun",
            "url": "https://www.worldhistory.org/Tutankhamun/",
            "note": "The restoration after Akhenaten."
          }
        ]
      ],
      [
        "The Amarna letters and the club of great kings",
        [
          {
            "title": "World History Encyclopedia: Amarna Letters",
            "url": "https://www.worldhistory.org/Amarna_Letters/",
            "note": "Free overview of the archive."
          },
          {
            "title": "Institute of Nautical Archaeology: the Uluburun shipwreck",
            "url": "https://nauticalarch.org/projects/uluburun-late-bronze-age-shipwreck-excavation/",
            "note": "The excavators' own account of the wreck and its cargo."
          },
          {
            "title": "Amarna Diplomacy: The Beginnings of International Relations",
            "note": "Raymond Cohen and Raymond Westbrook, eds. (2000). The 'great powers club' analysed."
          }
        ]
      ],
      [
        "Ramesses II, Kadesh and the treaty with the Hittites",
        [
          {
            "title": "World History Encyclopedia: Battle of Kadesh",
            "url": "https://www.worldhistory.org/Battle_of_Kadesh/",
            "note": "The battle and its sources."
          },
          {
            "title": "World History Encyclopedia: Ramesses II",
            "url": "https://www.worldhistory.org/Ramesses_II/",
            "note": "The reign, buildings and the treaty."
          }
        ]
      ],
      [
        "Minoan Crete and the eruption of Thera",
        [
          {
            "title": "OpenStax, World History Vol. 1, 6.1: Early Mediterranean Peoples",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-1-early-mediterranean-peoples",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Minoan Civilization",
            "url": "https://www.worldhistory.org/Minoan_Civilization/",
            "note": "Free overview of the palaces and art."
          },
          {
            "title": "World History Encyclopedia: Thera",
            "url": "https://www.worldhistory.org/Thera/",
            "note": "The island, Akrotiri and the eruption."
          }
        ]
      ],
      [
        "Mycenaean Greece, Linear B and the question of Troy",
        [
          {
            "title": "World History Encyclopedia: Mycenaean Civilization",
            "url": "https://www.worldhistory.org/Mycenaean_Civilization/",
            "note": "Free overview of the palaces."
          },
          {
            "title": "World History Encyclopedia: Linear B",
            "url": "https://www.worldhistory.org/Linear_B/",
            "note": "The script and Ventris's decipherment."
          },
          {
            "title": "World History Encyclopedia: Troy",
            "url": "https://www.worldhistory.org/troy/",
            "note": "The site, its layers and the war debate."
          }
        ]
      ],
      [
        "Bronze Age Europe: tin, amber and the Nebra sky disc",
        [
          {
            "title": "World History Encyclopedia: Nebra Sky Disc",
            "url": "https://www.worldhistory.org/Nebra_Sky_Disc/",
            "note": "The disc, its finding and its dating."
          },
          {
            "title": "World History Encyclopedia: Nordic Bronze Age",
            "url": "https://www.worldhistory.org/Nordic_Bronze_Age/",
            "note": "Scandinavia's Bronze Age, including the sun chariot."
          }
        ]
      ],
      [
        "Ugarit and the invention of the alphabet",
        [
          {
            "title": "World History Encyclopedia: Ugarit",
            "url": "https://www.worldhistory.org/ugarit/",
            "note": "The city, its archives and its end."
          },
          {
            "title": "World History Encyclopedia: Alphabet",
            "url": "https://www.worldhistory.org/alphabet/",
            "note": "From Proto-Sinaitic to Greek."
          },
          {
            "title": "World History Encyclopedia: Phoenician Alphabet",
            "url": "https://www.worldhistory.org/Phoenician_Alphabet/",
            "note": "The 22-letter alphabet that spread after the collapse."
          }
        ]
      ],
      [
        "The fading of the Indus cities, about 1900–1300 BC",
        [
          {
            "title": "OpenStax, World History Vol. 1, 3.4: The Indus Valley Civilization",
            "url": "https://openstax.org/books/world-history-volume-1/pages/3-4-the-indus-valley-civilization",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Mohenjo-daro",
            "url": "https://www.worldhistory.org/Mohenjo-daro/",
            "note": "The city, its decline, and the 'massacre' myth."
          }
        ]
      ],
      [
        "The Vedic peoples and the Rigveda",
        [
          {
            "title": "OpenStax, World History Vol. 1, 5.4: Vedic India to the Fall of the Maurya Empire",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-4-vedic-india-to-the-fall-of-the-maurya-empire",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "Wikisource: The Rigveda (R. T. H. Griffith's translation)",
            "url": "https://en.wikisource.org/wiki/The_Rig_Veda",
            "note": "Public-domain translation (1889–92) of the whole text."
          },
          {
            "title": "World History Encyclopedia: Rig Veda",
            "url": "https://www.worldhistory.org/Rig_Veda/",
            "note": "Free overview of the text and its dating."
          }
        ]
      ],
      [
        "The Shang dynasty and the bronze of Anyang",
        [
          {
            "title": "OpenStax, World History Vol. 1, 5.1: Ancient China",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-1-ancient-china",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Shang Dynasty",
            "url": "https://www.worldhistory.org/Shang_Dynasty/",
            "note": "Free overview of the dynasty."
          }
        ]
      ],
      [
        "Oracle bones: China's first writing",
        [
          {
            "title": "World History Encyclopedia: Oracle Bones",
            "url": "https://www.worldhistory.org/Oracle_Bones/",
            "note": "How divination worked and what was asked."
          },
          {
            "title": "World History Encyclopedia: Chinese Writing",
            "url": "https://www.worldhistory.org/Chinese_Writing/",
            "note": "From oracle bones to modern characters."
          }
        ]
      ],
      [
        "The Olmec, and the Americas around 1200 BC",
        [
          {
            "title": "OpenStax, World History Vol. 1, 8.2: Early Cultures and Civilizations in the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-2-early-cultures-and-civilizations-in-the-americas",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Olmec Civilization",
            "url": "https://www.worldhistory.org/Olmec_Civilization/",
            "note": "Free overview, including the colossal heads."
          },
          {
            "title": "World History Encyclopedia: Poverty Point",
            "url": "https://www.worldhistory.org/Poverty_Point/",
            "note": "The Louisiana earthworks."
          }
        ]
      ],
      [
        "The Lapita voyagers of the Pacific",
        [
          {
            "title": "Skoglund et al., 'Genomic insights into the peopling of the Southwest Pacific', Nature (2016)",
            "url": "https://www.nature.com/articles/nature19844",
            "note": "The Teouma and Tonga ancient DNA study."
          },
          {
            "title": "World History Encyclopedia: Polynesia",
            "url": "https://www.worldhistory.org/Polynesia/",
            "note": "The settlement of the Pacific, from Lapita on."
          },
          {
            "title": "On the Road of the Winds",
            "note": "Patrick V. Kirch (rev. ed. 2017). The archaeology of the Pacific islands."
          }
        ]
      ],
      [
        "The Late Bronze Age collapse and the Sea Peoples",
        [
          {
            "title": "World History Encyclopedia: Bronze Age Collapse",
            "url": "https://www.worldhistory.org/Bronze_Age_Collapse/",
            "note": "Free overview of the theories."
          },
          {
            "title": "World History Encyclopedia: Sea Peoples",
            "url": "https://www.worldhistory.org/Sea_Peoples/",
            "note": "The Egyptian sources and the peoples named."
          },
          {
            "title": "1177 B.C.: The Year Civilization Collapsed",
            "note": "Eric H. Cline (2014; rev. 2021). The systems-collapse case."
          }
        ]
      ],
      [
        "Connections: the world around 1000 BC",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 6: Mediterranean Peoples (introduction)",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-introduction",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only; not adapted."
          },
          {
            "title": "World History Encyclopedia: Chariot",
            "url": "https://www.worldhistory.org/chariot/",
            "note": "The weapon that linked the age, from the steppe to China."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 4 · The axial age, 800–300 BC",
    "lessons": [
      [
        "Map: the world in 800 BC",
        [
          {
            "title": "OpenStax World History Vol. 1, ch. 4: The Near East",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-introduction",
            "note": "Further reading only (CC BY-NC-SA; cited, not adapted)."
          },
          {
            "title": "Internet Ancient History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/ancient/asbook.html",
            "note": "Fordham's index of primary texts, by region, for the whole stage."
          }
        ]
      ],
      [
        "The axial age: Jaspers's idea and its critics",
        [
          {
            "title": "Axial Age (Wikipedia)",
            "url": "https://en.wikipedia.org/wiki/Axial_Age",
            "note": "Overview of Jaspers's thesis and its critics, with references to the Seshat study."
          },
          {
            "title": "Karl Jaspers, The Origin and Goal of History (1949; English 1953)",
            "note": "The book that named the axial age."
          },
          {
            "title": "Robert Bellah and Hans Joas (eds.), The Axial Age and Its Consequences (2012)",
            "note": "The modern case for and against, from many specialists."
          }
        ]
      ],
      [
        "The Neo-Assyrian empire: Nineveh and the art of conquest",
        [
          {
            "title": "OpenStax World History Vol. 1, 4.1 From Old Babylon to the Medes",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-1-from-old-babylon-to-the-medes",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Neo-Assyrian Empire (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Neo-Assyrian_Empire/",
            "note": "The kings and the provinces."
          },
          {
            "title": "Ashurbanipal (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Ashurbanipal/",
            "note": "The last great king, and the library of Nineveh."
          }
        ]
      ],
      [
        "The Phoenicians: Tyre, purple and the alphabet",
        [
          {
            "title": "OpenStax World History Vol. 1, 6.1 Early Mediterranean Peoples",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-1-early-mediterranean-peoples",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Phoenicia (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Phoenicia/",
            "note": "Cities, trade and colonies."
          },
          {
            "title": "Tyre (Livius)",
            "url": "https://www.livius.org/articles/place/tyre/",
            "note": "The city's history, including Alexander's siege."
          }
        ]
      ],
      [
        "Israel and Judah: two kingdoms between the empires",
        [
          {
            "title": "OpenStax World History Vol. 1, 4.4 The Hebrews",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-4-the-hebrews",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Internet Ancient History Sourcebook: Israel",
            "url": "https://sourcebooks.fordham.edu/ancient/asbook06.asp",
            "note": "Fordham's texts, including the outside inscriptions."
          },
          {
            "title": "Kingdom of Israel (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Kingdom_of_Israel/",
            "note": "The northern kingdom to 722 BC."
          }
        ]
      ],
      [
        "Kush: the 25th dynasty and Napata",
        [
          {
            "title": "OpenStax World History Vol. 1, 9.3 The Kingdom of Kush",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-3-the-kingdom-of-kush",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "The Kingdom of Kush (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Kush/",
            "note": "From Kerma to Meroë."
          }
        ]
      ],
      [
        "Zhou China: the Mandate of Heaven and the Spring and Autumn period",
        [
          {
            "title": "OpenStax World History Vol. 1, 5.1 Ancient China",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-1-ancient-china",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Zhou Dynasty (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Zhou_Dynasty/",
            "note": "Western and Eastern Zhou."
          },
          {
            "title": "Internet East Asian History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/eastasia/eastasiasbook.asp",
            "note": "Fordham's Chinese texts, including the Zhou classics."
          }
        ]
      ],
      [
        "The Greek polis: colonies, hoplites and tyrants",
        [
          {
            "title": "OpenStax World History Vol. 1, 6.2 Ancient Greece",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-2-ancient-greece",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Greek Colonization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Greek_Colonization/",
            "note": "The colonies from Spain to the Black Sea."
          },
          {
            "title": "Hoplite (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Hoplite/",
            "note": "Arms, armour and the phalanx."
          }
        ]
      ],
      [
        "The Etruscans",
        [
          {
            "title": "Etruscan Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Etruscan_Civilization/",
            "note": "Cities, religion, decline."
          },
          {
            "title": "Etruscan Art (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Etruscan_Art/",
            "note": "The tombs of Tarquinia and Caere."
          }
        ]
      ],
      [
        "The Scythians: horse archers of the steppe",
        [
          {
            "title": "OpenStax World History Vol. 1, 5.2 The Steppes",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-2-the-steppes",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Herodotus, Histories, vol. 1 (tr. G. C. Macaulay, 1890), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/2707",
            "note": "Book 4 is the Scythian book."
          },
          {
            "title": "Scythians (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Scythians/",
            "note": "Overview, with the archaeology."
          }
        ]
      ],
      [
        "The Celts: Hallstatt and La Tène",
        [
          {
            "title": "Hallstatt Culture (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Hallstatt_Culture/",
            "note": "The salt mines and the princely graves."
          },
          {
            "title": "La Tène Culture (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/La_Tene_Culture/",
            "note": "The art style and its spread."
          },
          {
            "title": "Ancient Celts (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/celt/",
            "note": "Who the Celts were, and the debate."
          }
        ]
      ],
      [
        "The Olmec, Monte Albán and the early Maya",
        [
          {
            "title": "OpenStax World History Vol. 1, 8.2 Early Cultures and Civilizations in the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-2-early-cultures-and-civilizations-in-the-americas",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Olmec Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Olmec_Civilization/",
            "note": "San Lorenzo, La Venta and the heads."
          },
          {
            "title": "Maya Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Maya_Civilization/",
            "note": "From the Preclassic onward."
          }
        ]
      ],
      [
        "Chavín de Huántar and the Andes",
        [
          {
            "title": "Chavin Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Chavin_Civilization/",
            "note": "The temple, its art and its reach."
          },
          {
            "title": "Richard L. Burger, Chavín and the Origins of Andean Civilization (1992)",
            "note": "The standard study."
          }
        ]
      ],
      [
        "Nebuchadnezzar's Babylon, 626–539 BC",
        [
          {
            "title": "Nebuchadnezzar II (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Nebuchadnezzar_II/",
            "note": "Reign and building."
          },
          {
            "title": "Ishtar Gate (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Ishtar_Gate/",
            "note": "The gate now in Berlin."
          },
          {
            "title": "Stephanie Dalley, The Mystery of the Hanging Garden of Babylon (2013)",
            "note": "The case for Nineveh; see also her The City of Babylon."
          }
        ]
      ],
      [
        "Exile and return: Judah under Babylon and Persia",
        [
          {
            "title": "OpenStax World History Vol. 1, 4.4 The Hebrews",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-4-the-hebrews",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Internet Ancient History Sourcebook: Israel",
            "url": "https://sourcebooks.fordham.edu/ancient/asbook06.asp",
            "note": "Exile and Persian-period texts."
          },
          {
            "title": "Amélie Kuhrt, The Persian Empire: A Corpus of Sources (2007)",
            "note": ": the Elephantine and Yehud documents in translation."
          }
        ]
      ],
      [
        "Cyrus the Great builds the Persian empire",
        [
          {
            "title": "OpenStax World History Vol. 1, 4.3 The Persian Empire",
            "url": "https://openstax.org/books/world-history-volume-1/pages/4-3-the-persian-empire",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Cyrus Cylinder (Livius)",
            "url": "https://www.livius.org/sources/content/cyrus-cylinder/",
            "note": "Translation and commentary."
          },
          {
            "title": "Kurash (Cyrus) the Great (Fordham Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/539cyrus1.asp",
            "note": "Primary texts on Cyrus."
          }
        ]
      ],
      [
        "Darius I: satrapies, the Royal Road and Persepolis",
        [
          {
            "title": "Behistun (Livius)",
            "url": "https://www.livius.org/articles/place/behistun/",
            "note": "The inscription, with translation."
          },
          {
            "title": "The Satrapies (Herodotus), at Livius",
            "url": "https://www.livius.org/articles/person/darius-the-great/sources/the-satrapies-herodotus/",
            "note": "Herodotus's list of twenty tax districts."
          },
          {
            "title": "Persepolis (Livius)",
            "url": "https://www.livius.org/articles/place/persepolis/",
            "note": "The site and its reliefs."
          }
        ]
      ],
      [
        "Zoroastrianism as history",
        [
          {
            "title": "Zoroastrianism (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/zoroastrianism/",
            "note": "Origins and spread."
          },
          {
            "title": "Internet Ancient History Sourcebook: Persia",
            "url": "https://sourcebooks.fordham.edu/ancient/asbook05.asp",
            "note": "Links to the Avesta in translation."
          },
          {
            "title": "Mary Boyce, Zoroastrians: Their Religious Beliefs and Practices (1979)",
            "note": "The classic history, with the early date."
          }
        ]
      ],
      [
        "India's mahajanapadas and the rise of Magadha",
        [
          {
            "title": "OpenStax World History Vol. 1, 5.4 Vedic India to the Fall of the Maurya Empire",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-4-vedic-india-to-the-fall-of-the-maurya-empire",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Magadha Kingdom (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Magadha/",
            "note": "The kingdom that united India."
          },
          {
            "title": "Internet Indian History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/india/indiasbook.asp",
            "note": "Fordham's Indian texts."
          }
        ]
      ],
      [
        "The Buddha and Mahavira: the shramana movements",
        [
          {
            "title": "Siddhartha Gautama (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/buddha/",
            "note": "Life and dating."
          },
          {
            "title": "Vardhamana (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Mahavira/",
            "note": "Mahavira's life."
          },
          {
            "title": "The Dhammapada (tr. F. Max Müller, 1881), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/2017",
            "note": "An early Buddhist text in a public-domain translation."
          }
        ]
      ],
      [
        "Confucius and the Hundred Schools",
        [
          {
            "title": "The Analects of Confucius (tr. James Legge), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/3330",
            "note": "The translation quoted in the lesson."
          },
          {
            "title": "Confucius (Stanford Encyclopedia of Philosophy)",
            "url": "https://plato.stanford.edu/entries/confucius/",
            "note": "The sources problem and the ideas."
          },
          {
            "title": "Mohism (Stanford Encyclopedia of Philosophy)",
            "url": "https://plato.stanford.edu/entries/mohism/",
            "note": "Mozi and his school."
          }
        ]
      ],
      [
        "Sparta: helots, the agoge and the Spartan mirage",
        [
          {
            "title": "Xenophon, The Polity of the Athenians and the Lacedaemonians, Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/1178",
            "note": "An admiring contemporary account of Spartan customs."
          },
          {
            "title": "Sparta (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/sparta/",
            "note": "Overview."
          }
        ]
      ],
      [
        "Athens invents democracy: Solon to Ephialtes",
        [
          {
            "title": "Aristotle, The Athenian Constitution (tr. F. G. Kenyon), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/26095",
            "note": "The ancient history of the constitution, Solon to the 4th century."
          },
          {
            "title": "Athenian Democracy (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Athenian_Democracy/",
            "note": "How the institutions worked."
          },
          {
            "title": "Cleisthenes (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Cleisthenes/",
            "note": "The reforms of 508/7 BC."
          }
        ]
      ],
      [
        "Carthage: from Tyrian colony to western sea power",
        [
          {
            "title": "OpenStax World History Vol. 1, 9.4 North Africa's Mediterranean and Trans-Saharan Connections",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-4-north-africas-mediterranean-and-trans-saharan-connections",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Punic Carthage (Livius)",
            "url": "https://www.livius.org/articles/place/carthage/",
            "note": "The city before Rome."
          },
          {
            "title": "Carthage (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/carthage/",
            "note": "Overview."
          }
        ]
      ],
      [
        "The Persian Wars, 499–479 BC",
        [
          {
            "title": "Herodotus, Histories, vol. 2 (tr. G. C. Macaulay, 1890), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/2456",
            "note": "Books 6–9: Marathon to Plataea."
          },
          {
            "title": "Persian Wars (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Persian_Wars/",
            "note": "Overview."
          },
          {
            "title": "Thermopylae (Livius)",
            "url": "https://www.livius.org/articles/place/thermopylae/",
            "note": "The battle and the site."
          }
        ]
      ],
      [
        "Athens' fifth-century empire and the age of Pericles",
        [
          {
            "title": "Delian League (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Delian_League/",
            "note": "From alliance to empire."
          },
          {
            "title": "Pericles (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/pericles/",
            "note": "His career."
          },
          {
            "title": "Parthenon (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Parthenon/",
            "note": "The temple and its sculpture."
          }
        ]
      ],
      [
        "Primary source: Pericles' Funeral Oration",
        [
          {
            "title": "Thucydides, History of the Peloponnesian War (tr. Richard Crawley, 1874), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/7142",
            "note": "The text quoted; Book 2, chapters 35–46, and 1.22 on speeches."
          },
          {
            "title": "Pericles' Funeral Oration (Fordham Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/pericles-funeralspeech.asp",
            "note": "The whole speech on one page."
          }
        ]
      ],
      [
        "The Peloponnesian War, 431–404 BC",
        [
          {
            "title": "Thucydides, History of the Peloponnesian War (tr. Richard Crawley), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/7142",
            "note": "The war in the words of its historian."
          },
          {
            "title": "Peloponnesian War (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Peloponnesian_War/",
            "note": "Overview."
          },
          {
            "title": "Xenophon, Anabasis (Fordham Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/xenophon-anabasis.asp",
            "note": "The march of the Ten Thousand, 401 BC."
          }
        ]
      ],
      [
        "Laozi, Shang Yang and the Warring States",
        [
          {
            "title": "The Tao Teh King (tr. James Legge, 1891), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/216",
            "note": "The translation quoted in the lesson."
          },
          {
            "title": "Legalism in Chinese Philosophy (Stanford Encyclopedia of Philosophy)",
            "url": "https://plato.stanford.edu/entries/chinese-legalism/",
            "note": "Shang Yang and the Legalists."
          },
          {
            "title": "Warring States Period (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Warring_States_Period/",
            "note": "Overview."
          }
        ]
      ],
      [
        "Early Rome: from kings to the conquest of Italy",
        [
          {
            "title": "OpenStax World History Vol. 1, 6.4 The Roman Republic",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-4-the-roman-republic",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Livy, History of Rome, Books 1–8, Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/19725",
            "note": "Rome's own story of its first centuries."
          },
          {
            "title": "The Twelve Tables (Fordham Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/12tables.asp",
            "note": "The surviving fragments."
          }
        ]
      ],
      [
        "Meroë, Nok and Africa's iron age",
        [
          {
            "title": "OpenStax World History Vol. 1, 9.2 The Emergence of Farming and the Bantu Migrations",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-2-the-emergence-of-farming-and-the-bantu-migrations",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Meroë (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Meroe/",
            "note": "The city and its iron."
          },
          {
            "title": "Nok Culture (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Nok_Culture/",
            "note": "The terracottas and their dating."
          }
        ]
      ],
      [
        "Philip II and Alexander the Great",
        [
          {
            "title": "OpenStax World History Vol. 1, 6.3 The Hellenistic Era",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-3-the-hellenistic-era",
            "note": "Further reading only (cited, not adapted)."
          },
          {
            "title": "Arrian, The Anabasis of Alexander (tr. E. J. Chinnock), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/46976",
            "note": "The best ancient account."
          },
          {
            "title": "Alexander the Great (Livius)",
            "url": "https://www.livius.org/articles/person/alexander-the-great/",
            "note": "Campaign by campaign; Harl's course goes deeper."
          }
        ]
      ],
      [
        "Connections: the world in 300 BC",
        [
          {
            "title": "Lydia (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Lydia/",
            "note": "The kingdom where coinage began."
          },
          {
            "title": "Achaemenid Empire (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Achaemenid_Empire/",
            "note": "The empire that joined three continents."
          },
          {
            "title": "Silk Road (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Silk_Road/",
            "note": "The routes that the next stage opens."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 5 · The classical empires, 300 BC–AD 300",
    "lessons": [
      [
        "Map: the world in 300 BC",
        [
          {
            "title": "OpenStax World History Vol. 1, 6.3 The Hellenistic Era",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-3-the-hellenistic-era",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "OpenStax World History Vol. 1, 5.2 The Steppes",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-2-the-steppes",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          }
        ]
      ],
      [
        "Alexander's heirs: the wars of the Successors",
        [
          {
            "title": "OpenStax World History Vol. 1, 6.3 The Hellenistic Era",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-3-the-hellenistic-era",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Seleucid Empire (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Seleucid_Empire/",
            "note": "Free overview, including the Successor wars and Ipsus."
          },
          {
            "title": "Amélie Kuhrt and Susan Sherwin-White (eds), Hellenism in the East",
            "note": ": Greek rule and local societies after Alexander."
          }
        ]
      ],
      [
        "Ptolemaic Egypt and the Library of Alexandria",
        [
          {
            "title": "Ptolemaic Dynasty (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Ptolemaic_Dynasty/",
            "note": "Free overview of the dynasty, 305–30 BC."
          },
          {
            "title": "Library of Alexandria (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Library_of_Alexandria/",
            "note": "The Library, its scholars, and the theories of its end."
          }
        ]
      ],
      [
        "The Seleucids, Bactria and the Greek East",
        [
          {
            "title": "Seleucid Empire (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Seleucid_Empire/",
            "note": "Free overview."
          },
          {
            "title": "Ai Khanum (Livius)",
            "url": "https://www.livius.org/articles/place/ai-khanum/",
            "note": "The Greek city on the Oxus, with photographs."
          },
          {
            "title": "Amélie Kuhrt and Susan Sherwin-White (eds), Hellenism in the East",
            "note": ": the Seleucid East in depth."
          }
        ]
      ],
      [
        "Rome's rise in Italy, 509–264 BC",
        [
          {
            "title": "OpenStax World History Vol. 1, 6.4 The Roman Republic",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-4-the-roman-republic",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "The Twelve Tables (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/12tables.asp",
            "note": "Rome's first law code, about 450 BC, in translation."
          },
          {
            "title": "Livy, The History of Rome, Books 9–26 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10907",
            "note": "Public-domain translation; the Samnite wars, Pyrrhus and Hannibal."
          }
        ]
      ],
      [
        "Carthage and the First Punic War",
        [
          {
            "title": "Carthage (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Carthage/",
            "note": "Free overview of the city and its empire."
          },
          {
            "title": "Punic Wars (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Punic_Wars/",
            "note": "The three wars in outline."
          },
          {
            "title": "Polybius, Histories, Vol. 1 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/44125",
            "note": "Shuckburgh's public-domain translation; our main source for the war."
          }
        ]
      ],
      [
        "Hannibal and the Second Punic War",
        [
          {
            "title": "Polybius on the Battle of Cannae (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/polybius-cannae.asp",
            "note": "Histories 3.107–118, the battle in Polybius's words."
          },
          {
            "title": "Hannibal (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Hannibal/",
            "note": "Free biography."
          },
          {
            "title": "Livy, The History of Rome, Books 9–26 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10907",
            "note": "Books 21–26 tell the war from Saguntum to Scipio in Spain."
          }
        ]
      ],
      [
        "Rome masters the Mediterranean, 200–133 BC",
        [
          {
            "title": "Polybius: Rome at the End of the Punic Wars (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/polybius6.asp",
            "note": "Polybius's analysis of the Roman constitution, Book 6."
          },
          {
            "title": "Roman Republic (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Roman_Republic/",
            "note": "Free overview."
          }
        ]
      ],
      [
        "The Gracchi, Marius and Sulla: the Republic breaks",
        [
          {
            "title": "Plutarch's Lives, Vol. 4 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/44315",
            "note": "Long's translation; contains the Lives of Tiberius and Caius Gracchus."
          },
          {
            "title": "Gracchi Brothers (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Gracchi/",
            "note": "Free overview of the two tribunes."
          },
          {
            "title": "OpenStax World History Vol. 1, 6.4 The Roman Republic",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-4-the-roman-republic",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          }
        ]
      ],
      [
        "Caesar crosses the Rubicon",
        [
          {
            "title": "Caesar, De Bello Gallico and Other Commentaries (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10657",
            "note": "Caesar's own account of Gaul and the civil war."
          },
          {
            "title": "Suetonius, The Deified Julius (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/suetonius-julius.asp",
            "note": "The ancient biography, including the Rubicon and the Ides of March."
          },
          {
            "title": "Ronald Syme, The Roman Revolution (1939)",
            "note": "The classic structural reading of the Republic's fall."
          }
        ]
      ],
      [
        "Augustus and the making of the principate",
        [
          {
            "title": "Res Gestae Divi Augusti (LacusCurtius)",
            "url": "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Augustus/Res_Gestae/home.html",
            "note": "Augustus's own record, Latin and Greek with an English translation."
          },
          {
            "title": "OpenStax World History Vol. 1, 6.5 The Age of Augustus",
            "url": "https://openstax.org/books/world-history-volume-1/pages/6-5-the-age-of-augustus",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Augustus (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Augustus/",
            "note": "Free biography."
          }
        ]
      ],
      [
        "The Pax Romana, from Tiberius to Marcus Aurelius",
        [
          {
            "title": "Pax Romana (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Pax_Romana/",
            "note": "Free overview."
          },
          {
            "title": "Suetonius, The Lives of the Twelve Caesars (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/6400",
            "note": "Caesar to Domitian, in public-domain translation."
          },
          {
            "title": "Edward Gibbon, The Decline and Fall of the Roman Empire (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/25717",
            "note": "Chapters 1–3 describe the Antonine age."
          }
        ]
      ],
      [
        "Running an empire: provinces, roads and cities",
        [
          {
            "title": "OpenStax World History Vol. 1, 7.3 The Roman Economy: Trade, Taxes, and Conquest",
            "url": "https://openstax.org/books/world-history-volume-1/pages/7-3-the-roman-economy-trade-taxes-and-conquest",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "OpenStax World History Vol. 1, 7.5 The Regions of Rome",
            "url": "https://openstax.org/books/world-history-volume-1/pages/7-5-the-regions-of-rome",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Josephus: The Roman Army in the First Century (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/josephus-warb.asp",
            "note": "A Jewish eyewitness describes Roman camps and discipline."
          }
        ]
      ],
      [
        "Primary source: Tacitus on Roman Britain",
        [
          {
            "title": "Tacitus, Life of Cnaeus Julius Agricola (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/tacitus-agricola.asp",
            "note": "The full text in Church and Brodribb's translation; the passages quoted are chapters 21 and 30."
          },
          {
            "title": "The Germany and the Agricola of Tacitus (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/7524",
            "note": "A second public-domain translation (the revised Oxford version) to compare."
          }
        ]
      ],
      [
        "Judea under Rome and the Jewish revolts, 66–135",
        [
          {
            "title": "Josephus, The Wars of the Jews (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/2850",
            "note": "Whiston's public-domain translation; the revolt of 66–73/74."
          },
          {
            "title": "Josephus, The War, Book VII (Penelope, University of Chicago)",
            "url": "https://penelope.uchicago.edu/josephus/war-7.html",
            "note": "The aftermath of AD 70 and the siege of Masada."
          },
          {
            "title": "Josephus: Galilee, Samaria and Judea in the First Century (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/josephus-wara.asp",
            "note": "Josephus's description of the land."
          }
        ]
      ],
      [
        "Christianity's first three centuries",
        [
          {
            "title": "Pliny and Trajan: Correspondence, about 112 (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/pliny-trajan1.asp",
            "note": "Includes the letters on how to treat Christians."
          },
          {
            "title": "Eusebius, Church History (New Advent)",
            "url": "https://www.newadvent.org/fathers/2501.htm",
            "note": "The first history of the Church, to the Great Persecution."
          },
          {
            "title": "OpenStax World History Vol. 1, 7.4 Religion in the Roman Empire",
            "url": "https://openstax.org/books/world-history-volume-1/pages/7-4-religion-in-the-roman-empire",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          }
        ]
      ],
      [
        "The third-century crisis, 235–284",
        [
          {
            "title": "The Crisis of the Third Century (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Crisis_of_the_Third_Century/",
            "note": "Free overview of 235–284."
          },
          {
            "title": "The Historia Augusta (LacusCurtius)",
            "url": "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Historia_Augusta/home.html",
            "note": "Lives of the third-century emperors; colourful and often unreliable, to be read with care."
          }
        ]
      ],
      [
        "Diocletian and the tetrarchy",
        [
          {
            "title": "Diocletian and Constantine: Efforts to Stabilize the Economy (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/diocletian-control.asp",
            "note": "Includes the Edict on Maximum Prices."
          },
          {
            "title": "Lactantius, Of the Manner in Which the Persecutors Died (New Advent)",
            "url": "https://www.newadvent.org/fathers/0705.htm",
            "note": "A hostile Christian contemporary on Diocletian and the persecution."
          },
          {
            "title": "Diocletian (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Diocletian/",
            "note": "Free biography."
          }
        ]
      ],
      [
        "Parthia, Rome's rival beyond the Euphrates",
        [
          {
            "title": "Plutarch's Lives, Vol. 3 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/14140",
            "note": "Contains the Life of Crassus, the main account of Carrhae."
          },
          {
            "title": "Chinese Accounts of Rome, Byzantium and the Middle East (Fordham East Asian History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/eastasia/romchin1.asp",
            "note": "Hirth's translations, including Gan Ying's mission and Anxi (Parthia)."
          }
        ]
      ],
      [
        "The Sasanians take Iran",
        [
          {
            "title": "Sasanian Empire (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Sasanian_Empire/",
            "note": "Free overview."
          },
          {
            "title": "Shapur I (Livius)",
            "url": "https://www.livius.org/articles/person/shapur-i/",
            "note": "The king, his wars with Rome and his inscriptions."
          },
          {
            "title": "OpenStax World History Vol. 1, 10.2 The Byzantine Empire and Persia",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-2-the-byzantine-empire-and-persia",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          }
        ]
      ],
      [
        "The Mauryas: Chandragupta and Ashoka",
        [
          {
            "title": "Ashoka: The Rock Edicts (Fordham Indian History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/india/ashoka-edicts.html",
            "note": "The edicts in an older translation; its date for Ashoka's conversion is outdated."
          },
          {
            "title": "OpenStax World History Vol. 1, 5.4 Vedic India to the Fall of the Maurya Empire",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-4-vedic-india-to-the-fall-of-the-maurya-empire",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Kautilya, from the Arthashastra (Fordham Indian History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/india/kautilya1.html",
            "note": "Shamasastry's translation; remember the text's date is debated."
          }
        ]
      ],
      [
        "The Kushans, the Indo-Greeks and the north-west",
        [
          {
            "title": "Gandhara Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Gandhara/",
            "note": "Free overview of the region, its Kushan rulers and its Buddhist art."
          },
          {
            "title": "Bactria (Livius)",
            "url": "https://www.livius.org/articles/place/bactria/",
            "note": "The Greek kingdom of Bactria, the Yuezhi and the Kushans."
          },
          {
            "title": "Fisher, A History of India",
            "note": ": the north-west after the Mauryas."
          }
        ]
      ],
      [
        "The Satavahanas, the Tamil kingdoms and the first Guptas",
        [
          {
            "title": "Gupta Empire (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Gupta_Empire/",
            "note": "Free overview; the early chapters cover Chandragupta I."
          },
          {
            "title": "The Periplus of the Erythraean Sea (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/periplus.asp",
            "note": "The merchant's guide to India's ports, including the Satavahana and Tamil coasts."
          }
        ]
      ],
      [
        "Qin Shi Huang unifies China",
        [
          {
            "title": "Li Si, Memorial on the Annexation of Feudal States (Columbia, Asia for Educators)",
            "url": "https://afe.easia.columbia.edu/main_pop/ps/ps_china-lisi-legalist-memorials.htm",
            "note": "The Qin chancellor's memorials, with study questions."
          },
          {
            "title": "Qin Dynasty (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Qin_Dynasty/",
            "note": "Free overview."
          },
          {
            "title": "OpenStax World History Vol. 1, 5.1 Ancient China",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-1-ancient-china",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          }
        ]
      ],
      [
        "The Han dynasty and Emperor Wu",
        [
          {
            "title": "Han Dynasty (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Han_Dynasty/",
            "note": "Free overview."
          },
          {
            "title": "Ban Zhao, Admonitions for Women (Columbia, Asia for Educators)",
            "url": "https://afe.easia.columbia.edu/main_pop/ps/ps_china-banzhao-admonitions.htm",
            "note": "A Han woman scholar's own words, with study questions."
          },
          {
            "title": "China timeline (Columbia, Asia for Educators)",
            "url": "https://afe.easia.columbia.edu/timelines/china_timeline.htm",
            "note": "Dynasties at a glance."
          }
        ]
      ],
      [
        "The Xiongnu and Zhang Qian's journey west",
        [
          {
            "title": "Silk Road (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Silk_Road/",
            "note": "Free overview, beginning with Zhang Qian."
          },
          {
            "title": "OpenStax World History Vol. 1, 5.2 The Steppes",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-2-the-steppes",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Thomas Barfield, The Perilous Frontier (1989)",
            "note": "The classic argument about the Xiongnu and China."
          }
        ]
      ],
      [
        "Han inventions, Sima Qian and the fall of Han",
        [
          {
            "title": "Sima Qian's Letter to Ren An (Columbia, Asia for Educators)",
            "url": "https://afe.easia.columbia.edu/main_pop/ps/ps_china-sima-qian-letter.htm",
            "note": "Excerpt of the letter, with introduction and questions."
          },
          {
            "title": "Sima Qian (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Sima_Qian/",
            "note": "Free biography."
          }
        ]
      ],
      [
        "Early Korea and Yayoi Japan",
        [
          {
            "title": "History of the Kingdom of Wei (Wei Zhi) on the Wa (Columbia, Asia for Educators)",
            "url": "https://afe.easia.columbia.edu/main_pop/ps/ps_japan-wei-history-wa-pimiko.htm",
            "note": "The Chinese account of Himiko (Pimiko) and Yamatai."
          },
          {
            "title": "OpenStax World History Vol. 1, 5.3 Korea, Japan, and Southeast Asia",
            "url": "https://openstax.org/books/world-history-volume-1/pages/5-3-korea-japan-and-southeast-asia",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Yayoi Period (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Yayoi_Period/",
            "note": "Free overview; also Cambridge History of Japan, vol. 1."
          }
        ]
      ],
      [
        "Meroë and the rise of Aksum",
        [
          {
            "title": "Accounts of Meroë, Kush and Axum (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/nubia1.asp",
            "note": "The classical sources on Kush and Aksum, in translation."
          },
          {
            "title": "OpenStax World History Vol. 1, 9.3 The Kingdom of Kush",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-3-the-kingdom-of-kush",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "OpenStax World History Vol. 1, 10.3 The Kingdoms of Aksum and Himyar",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-3-the-kingdoms-of-aksum-and-himyar",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          }
        ]
      ],
      [
        "The Bantu expansion",
        [
          {
            "title": "OpenStax World History Vol. 1, 9.2 The Emergence of Farming and the Bantu Migrations",
            "url": "https://openstax.org/books/world-history-volume-1/pages/9-2-the-emergence-of-farming-and-the-bantu-migrations",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Bantu Migration (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Bantu_Migration/",
            "note": "Free overview."
          },
          {
            "title": "Nok Culture (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Nok_Culture/",
            "note": "The terracottas and early iron of central Nigeria."
          }
        ]
      ],
      [
        "Teotihuacan, the early Maya and the Hopewell",
        [
          {
            "title": "OpenStax World History Vol. 1, 8.2 Early Cultures and Civilizations in the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-2-early-cultures-and-civilizations-in-the-americas",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          },
          {
            "title": "Teotihuacan (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Teotihuacan/",
            "note": "Free overview."
          },
          {
            "title": "Maya Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Maya_Civilization/",
            "note": "Free overview; for the Hopewell, see Barnhart's Ancient Civilizations of North America."
          }
        ]
      ],
      [
        "The Nazca and the Moche",
        [
          {
            "title": "Nazca Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Nazca_Civilization/",
            "note": "Free overview, including the lines."
          },
          {
            "title": "Moche Civilization (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Moche_Civilization/",
            "note": "Free overview, including Sipán."
          },
          {
            "title": "OpenStax World History Vol. 1, 8.2 Early Cultures and Civilizations in the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-2-early-cultures-and-civilizations-in-the-americas",
            "note": "OpenStax, CC BY-NC-SA 4.0; cited as further reading only, not adapted."
          }
        ]
      ],
      [
        "Connections: the Silk Roads and the Indian Ocean",
        [
          {
            "title": "The Periplus of the Erythraean Sea (Fordham Ancient History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/ancient/periplus.asp",
            "note": "The first-century merchant's guide, complete."
          },
          {
            "title": "Chinese Accounts of Rome, Byzantium and the Middle East (Fordham East Asian History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/eastasia/romchin1.asp",
            "note": "Includes the Chinese record of the Daqin 'embassy' of 166."
          },
          {
            "title": "Silk Road (World History Encyclopedia)",
            "url": "https://www.worldhistory.org/Silk_Road/",
            "note": "Free overview."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 6 · Faiths and new empires, 300–1000",
    "lessons": [
      [
        "Map: the world in AD 300",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 10: Empires of Faith",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-introduction",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "World History Encyclopedia: Sasanian Empire",
            "url": "https://www.worldhistory.org/Sasanian_Empire/",
            "note": "Free overview of Rome's great rival."
          }
        ]
      ],
      [
        "Constantine and Christian Rome, 312–451",
        [
          {
            "title": "OpenStax, World History Vol. 1, 10.1: The Eastward Shift",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-1-the-eastward-shift",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "Fordham Sourcebook: the Edict of Galerius and the \"Edict of Milan\"",
            "url": "https://sourcebooks.fordham.edu/source/edict-milan.asp",
            "note": "The texts of 311 and 313, from Lactantius."
          },
          {
            "title": "Fordham Sourcebook: Theodosian Code XVI.i.2, banning other religions",
            "url": "https://sourcebooks.fordham.edu/source/theodcodeXVI.asp",
            "note": "The law of 380 making Nicene Christianity the faith of the empire."
          }
        ]
      ],
      [
        "Goths, Huns and the sack of Rome, 376–455",
        [
          {
            "title": "Fordham Sourcebook: Ammianus Marcellinus on the Battle of Adrianople",
            "url": "https://sourcebooks.fordham.edu/source/378adrianople.asp",
            "note": "An ex-officer's account of 9 August 378."
          },
          {
            "title": "Fordham Sourcebook: Priscus at the court of Attila",
            "url": "https://sourcebooks.fordham.edu/source/priscus1.asp",
            "note": "The envoy's eyewitness account of 449."
          },
          {
            "title": "Ammianus Marcellinus, The Roman History (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/28587",
            "note": "The full history, in the Yonge translation (1862)."
          }
        ]
      ],
      [
        "476: did Rome fall?",
        [
          {
            "title": "OpenStax, World History Vol. 1, 10.1: The Eastward Shift",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-1-the-eastward-shift",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'The Fall of the Roman West'."
          },
          {
            "title": "Edward Gibbon, The History of the Decline and Fall of the Roman Empire (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/25717",
            "note": "The classic 'decline and fall' reading, 1776–1789. ."
          },
          {
            "title": "Anthony Kaldellis, The New Roman Empire",
            "note": ": the Eastern Empire as Rome continuing. For the West, see also Bryan Ward-Perkins, The Fall of Rome and the End of Civilization (2005), and Peter Brown, The World of Late Antiquity (1971)."
          }
        ]
      ],
      [
        "The Gupta golden age, about 320–550",
        [
          {
            "title": "Faxian, A Record of Buddhistic Kingdoms (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/2124",
            "note": "The Chinese monk's travels in Gupta India, about 399–412, translated by James Legge (1886)."
          },
          {
            "title": "MacTutor: Aryabhata I",
            "url": "https://mathshistory.st-andrews.ac.uk/Biographies/Aryabhata_I/",
            "note": "St Andrews history of mathematics: the Aryabhatiya of 499."
          },
          {
            "title": "Kalidasa, Translations of Shakuntala and Other Works (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/16659",
            "note": "Arthur W. Ryder's translations."
          }
        ]
      ],
      [
        "Teotihuacan and the Classic Maya kings, 250–650",
        [
          {
            "title": "OpenStax, World History Vol. 1, 8.2: Early Cultures and Civilizations in the Americas",
            "url": "https://openstax.org/books/world-history-volume-1/pages/8-2-early-cultures-and-civilizations-in-the-americas",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "World History Encyclopedia: Teotihuacan",
            "url": "https://www.worldhistory.org/Teotihuacan/",
            "note": "Free overview of the city."
          },
          {
            "title": "World History Encyclopedia: Tikal",
            "url": "https://www.worldhistory.org/Tikal/",
            "note": "Tikal, the 'Arrival' of 378 and the wars with Calakmul."
          }
        ]
      ],
      [
        "The Germanic kingdoms: Ostrogoths, Visigoths, Vandals and Anglo-Saxons",
        [
          {
            "title": "Jordanes, The Origin and Deeds of the Goths (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/14809",
            "note": "The Getica of 551, translated by Charles C. Mierow."
          },
          {
            "title": "Fordham Sourcebook: Jordanes on Theodoric, King of the Ostrogoths",
            "url": "https://sourcebooks.fordham.edu/source/jordanes-theodoric1.asp",
            "note": "Short extract."
          },
          {
            "title": "Gretzinger et al., 'The Anglo-Saxon migration and the formation of the early English gene pool' (Nature, 2022)",
            "url": "https://www.nature.com/articles/s41586-022-05247-2",
            "note": "The ancient-DNA study of the migration; open access."
          }
        ]
      ],
      [
        "Clovis and the Merovingian Franks, 481–751",
        [
          {
            "title": "Fordham Sourcebook: Gregory of Tours, The Conversion of Clovis",
            "url": "https://sourcebooks.fordham.edu/source/gregory-clovisconv.asp",
            "note": "The story as Gregory told it."
          },
          {
            "title": "Gregory of Tours, History of the Franks (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/74955",
            "note": "The main source for the Merovingians."
          },
          {
            "title": "Fordham Sourcebook: Arabs, Franks, and the Battle of Tours, 732",
            "url": "https://sourcebooks.fordham.edu/source/732tours.asp",
            "note": "Three accounts of Poitiers."
          }
        ]
      ],
      [
        "Justinian, Theodora and the Roman reconquest, 527–565",
        [
          {
            "title": "Fordham Sourcebook: Procopius on the Nika revolt, 532",
            "url": "https://sourcebooks.fordham.edu/source/procop-wars1.asp",
            "note": "Includes Theodora's speech."
          },
          {
            "title": "Fordham Sourcebook: Procopius on the plague, 542",
            "url": "https://sourcebooks.fordham.edu/source/542procopius-plague.asp",
            "note": "The eyewitness account from Constantinople."
          },
          {
            "title": "Mordechai, Eisenberg et al., 'The Justinianic Plague: An inconsequential pandemic?' (PNAS, 2019)",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6926030/",
            "note": "The minimalist case on the death toll; free full text."
          }
        ]
      ],
      [
        "The Sasanian Persian empire, 224–651",
        [
          {
            "title": "OpenStax, World History Vol. 1, 10.2: The Byzantine Empire and Persia",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-2-the-byzantine-empire-and-persia",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "Livius: Ctesiphon",
            "url": "https://www.livius.org/articles/place/ctesiphon/",
            "note": "The Sasanian capital and the Taq Kasra."
          },
          {
            "title": "World History Encyclopedia: Sasanian Empire",
            "url": "https://www.worldhistory.org/Sasanian_Empire/",
            "note": "Free overview."
          }
        ]
      ],
      [
        "The Sui reunite China and the Tang build Chang'an, 581–755",
        [
          {
            "title": "OpenStax, World History Vol. 1, 12.1: The Indian Ocean World in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-1-the-indian-ocean-world-in-the-early-middle-ages",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'Sui and Tang China'."
          },
          {
            "title": "World History Encyclopedia: Chang'an",
            "url": "https://www.worldhistory.org/Chang%27an/",
            "note": "The Tang capital."
          },
          {
            "title": "World History Encyclopedia: Wu Zetian",
            "url": "https://www.worldhistory.org/Wu_Zetian/",
            "note": "China's only woman emperor."
          }
        ]
      ],
      [
        "The last war of antiquity: Rome against Persia, 602–628",
        [
          {
            "title": "OpenStax, World History Vol. 1, 10.2: The Byzantine Empire and Persia",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-2-the-byzantine-empire-and-persia",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'The Last Great Empires of Antiquity'."
          },
          {
            "title": "World History Encyclopedia: Heraclius",
            "url": "https://www.worldhistory.org/Heraclius/",
            "note": "The emperor and his Persian campaigns."
          },
          {
            "title": "World History Encyclopedia: Khosrow II",
            "url": "https://www.worldhistory.org/Khosrow_II/",
            "note": "The Persian side."
          }
        ]
      ],
      [
        "Arabia before Islam and the life of Muhammad, about 570–632",
        [
          {
            "title": "OpenStax, World History Vol. 1, 11.1: The Rise and Message of Islam",
            "url": "https://openstax.org/books/world-history-volume-1/pages/11-1-the-rise-and-message-of-islam",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 1, 10.3: The Kingdoms of Aksum and Himyar",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-3-the-kingdoms-of-aksum-and-himyar",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. Arabia's southern neighbours before Islam."
          },
          {
            "title": "University of Birmingham: the Birmingham Qur'an manuscript dated",
            "url": "https://www.birmingham.ac.uk/news/2015/birmingham-quran-manuscript-dated-among-the-oldest-in-the-world",
            "note": "The 2015 radiocarbon result."
          }
        ]
      ],
      [
        "The Rashidun caliphs and the Arab conquests, 632–661",
        [
          {
            "title": "OpenStax, World History Vol. 1, 11.2: The Arab-Islamic Conquests and the First Islamic States",
            "url": "https://openstax.org/books/world-history-volume-1/pages/11-2-the-arab-islamic-conquests-and-the-first-islamic-states",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "Fordham Sourcebook: al-Baladhuri on the Battle of the Yarmuk (636) and after",
            "url": "https://sourcebooks.fordham.edu/source/yarmuk.asp",
            "note": "A 9th-century Arabic historian on the conquest of Syria."
          },
          {
            "title": "World History Encyclopedia: Rashidun Caliphate",
            "url": "https://www.worldhistory.org/Rashidun_Caliphate/",
            "note": "Free overview."
          }
        ]
      ],
      [
        "Monks and missionaries: Ireland, Iona and the conversion of the English, 431–754",
        [
          {
            "title": "Fordham Sourcebook: Bede, Ecclesiastical History, Book I",
            "url": "https://sourcebooks.fordham.edu/basis/bede-book1.asp",
            "note": "Gregory the Great's mission to Kent, 597, and his advice on pagan temples."
          },
          {
            "title": "Fordham Sourcebook: The Correspondence of St. Boniface",
            "url": "https://sourcebooks.fordham.edu/basis/boniface-letters.asp",
            "note": "The missionary's own letters."
          },
          {
            "title": "World History Encyclopedia: Synod of Whitby",
            "url": "https://www.worldhistory.org/Synod_of_Whitby/",
            "note": "The meeting of 664."
          }
        ]
      ],
      [
        "Primary source: Bede and the sparrow in King Edwin's hall",
        [
          {
            "title": "Bede's Ecclesiastical History of England, trans. A. M. Sellar, 1907 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/38326",
            "note": "The translation quoted; the passage is Book II, chapter 13."
          },
          {
            "title": "Fordham Sourcebook: Bede, Ecclesiastical History, Book II",
            "url": "https://sourcebooks.fordham.edu/basis/bede-book2.asp",
            "note": "The whole of Book II, Edwin's conversion in context."
          },
          {
            "title": "World History Encyclopedia: Bede",
            "url": "https://www.worldhistory.org/Bede/",
            "note": "His life and work at Jarrow."
          }
        ]
      ],
      [
        "The Umayyad caliphate from Damascus, 661–750",
        [
          {
            "title": "OpenStax, World History Vol. 1, 11.2: The Arab-Islamic Conquests and the First Islamic States",
            "url": "https://openstax.org/books/world-history-volume-1/pages/11-2-the-arab-islamic-conquests-and-the-first-islamic-states",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'Islam's First Dynasty'."
          },
          {
            "title": "World History Encyclopedia: Umayyad Dynasty",
            "url": "https://www.worldhistory.org/Umayyad_Dynasty/",
            "note": "Free overview."
          }
        ]
      ],
      [
        "Silla's Korea and Japan from Nara to Heian, 538–1000",
        [
          {
            "title": "OpenStax, World History Vol. 1, 12.3: Border States: Sogdiana, Korea, and Japan",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-3-border-states-sogdiana-korea-and-japan",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "Murasaki Shikibu, The Tale of Genji (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/66057",
            "note": "The first part, in Arthur Waley's translation."
          },
          {
            "title": "Sei Shōnagon, The Pillow-Book (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/76016",
            "note": "Heian court life around 1000."
          }
        ]
      ],
      [
        "India after the Guptas: Harsha, the Chalukyas, the Rashtrakutas and the Cholas",
        [
          {
            "title": "OpenStax, World History Vol. 1, 12.1: The Indian Ocean World in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-1-the-indian-ocean-world-in-the-early-middle-ages",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'South Asia in the Early Middle Ages'."
          },
          {
            "title": "World History Encyclopedia: Harsha",
            "url": "https://www.worldhistory.org/Harsha/",
            "note": "The king of Kanauj."
          },
          {
            "title": "World History Encyclopedia: Rashtrakuta Dynasty",
            "url": "https://www.worldhistory.org/Rashtrakuta_Dynasty/",
            "note": "The Deccan dynasty of Ellora."
          }
        ]
      ],
      [
        "Al-Andalus: from the conquest of 711 to the caliphate of Córdoba",
        [
          {
            "title": "OpenStax, World History Vol. 1, 13.1: The Post-Roman West in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/13-1-the-post-roman-west-in-the-early-middle-ages",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'The Iberian Peninsula and the World of Al-Andalus'."
          },
          {
            "title": "World History Encyclopedia: Abd al-Rahman I",
            "url": "https://www.worldhistory.org/Abd_al-Rahman_I/",
            "note": "The Umayyad refugee who founded the emirate of Córdoba."
          },
          {
            "title": "World History Encyclopedia: Abd al-Rahman III",
            "url": "https://www.worldhistory.org/Abd_al-Rahman_III/",
            "note": "The first caliph of Córdoba."
          }
        ]
      ],
      [
        "Talas, An Lushan and the fall of the Tang, 751–960",
        [
          {
            "title": "OpenStax, World History Vol. 1, 12.2: East-West Interactions in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-2-east-west-interactions-in-the-early-middle-ages",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. The Silk Roads in the Tang age."
          },
          {
            "title": "World History Encyclopedia: Tang Dynasty",
            "url": "https://www.worldhistory.org/Tang_Dynasty/",
            "note": "The dynasty from founding to fall."
          }
        ]
      ],
      [
        "The Abbasids, Baghdad and the House of Wisdom, 750–1000",
        [
          {
            "title": "OpenStax, World History Vol. 1, 11.3: Islamization and Religious Rule under Islam",
            "url": "https://openstax.org/books/world-history-volume-1/pages/11-3-islamization-and-religious-rule-under-islam",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'The Abbasid Translation Movement'."
          },
          {
            "title": "Fordham Sourcebook: Yaqut, Baghdad under the Abbasids",
            "url": "https://sourcebooks.fordham.edu/source/1000baghdad.asp",
            "note": "A medieval Arabic description of the city."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Greek Sources in Arabic and Islamic Philosophy",
            "url": "https://plato.stanford.edu/entries/arabic-islamic-greek/",
            "note": "The translation movement, by Cristina D'Ancona."
          }
        ]
      ],
      [
        "Charlemagne and the Carolingian empire, 751–962",
        [
          {
            "title": "Fordham Sourcebook: Einhard, The Life of Charlemagne",
            "url": "https://sourcebooks.fordham.edu/basis/einhard.asp",
            "note": "The biography by a man of his court, translated by S. E. Turner (1880)."
          },
          {
            "title": "Early Lives of Charlemagne, by Einhard and the Monk of St Gall (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/48870",
            "note": "Edited by A. J. Grant."
          },
          {
            "title": "OpenStax, World History Vol. 1, 13.1: The Post-Roman West in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/13-1-the-post-roman-west-in-the-early-middle-ages",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          }
        ]
      ],
      [
        "Byzantine Iconoclasm and the Macedonian revival, 717–1025",
        [
          {
            "title": "Fordham Sourcebook: the Iconoclast Council of 754",
            "url": "https://sourcebooks.fordham.edu/source/icono-cncl754.asp",
            "note": "The iconoclasts' own definition, as preserved by their opponents."
          },
          {
            "title": "Fordham Sourcebook: Liutprand of Cremona, Report of his Mission to Constantinople",
            "url": "https://sourcebooks.fordham.edu/source/liudprand1.asp",
            "note": "A hostile Western envoy at the court of Nikephoros Phokas, 968."
          },
          {
            "title": "Fordham: Byzantine Sources Page",
            "url": "https://sourcebooks.fordham.edu/halsall/byzantium/index.asp",
            "note": "The full collection. : Treadgold, Norwich, Kaldellis."
          }
        ]
      ],
      [
        "Srivijaya, Borobudur and the first Angkor: South-East Asia, 650–1000",
        [
          {
            "title": "OpenStax, World History Vol. 1, 12.2: East-West Interactions in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-2-east-west-interactions-in-the-early-middle-ages",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'Religion and Trade in South and Southeast Asia'."
          },
          {
            "title": "World History Encyclopedia: Borobudur",
            "url": "https://www.worldhistory.org/Borobudur/",
            "note": "The Sailendra monument."
          },
          {
            "title": "World History Encyclopedia: Khmer Empire",
            "url": "https://www.worldhistory.org/Khmer_Empire/",
            "note": "From Jayavarman II to Angkor."
          }
        ]
      ],
      [
        "Ghana and the trans-Saharan gold trade",
        [
          {
            "title": "OpenStax, World History Vol. 1, 15.2: Medieval Sub-Saharan Africa",
            "url": "https://openstax.org/books/world-history-volume-1/pages/15-2-medieval-sub-saharan-africa",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. See 'The Ghana Empire'."
          },
          {
            "title": "Boston University African Studies Center: Kingdom of Ghana",
            "url": "https://www.bu.edu/africa/outreach/teachingresources/history/ancient-to-medieval-history/k_o_ghana/",
            "note": "Teaching resource, with al-Bakri's description."
          },
          {
            "title": "World History Encyclopedia: Ghana Empire",
            "url": "https://www.worldhistory.org/Ghana_Empire/",
            "note": "Free overview."
          }
        ]
      ],
      [
        "Aksum's decline, Christian Nubia and the first Swahili towns",
        [
          {
            "title": "OpenStax, World History Vol. 1, 10.3: The Kingdoms of Aksum and Himyar",
            "url": "https://openstax.org/books/world-history-volume-1/pages/10-3-the-kingdoms-of-aksum-and-himyar",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted."
          },
          {
            "title": "Fordham Sourcebook: Accounts of Meroë, Kush, and Axum",
            "url": "https://sourcebooks.fordham.edu/halsall/ancient/nubia1.asp",
            "note": "Ancient accounts, including the inscriptions of Ezana."
          },
          {
            "title": "World History Encyclopedia: Swahili Coast",
            "url": "https://www.worldhistory.org/Swahili_Coast/",
            "note": "The towns and their trade."
          }
        ]
      ],
      [
        "The Classic Maya collapse, about 750–950",
        [
          {
            "title": "World History Encyclopedia: Maya Civilization",
            "url": "https://www.worldhistory.org/Maya_Civilization/",
            "note": "Free overview, including the collapse."
          },
          {
            "title": "David Webster, The Fall of the Ancient Maya (2002)",
            "note": "A printed book by David Webster weighing the explanations."
          },
          {
            "title": "World History Encyclopedia: Copán",
            "url": "https://www.worldhistory.org/Copan/",
            "note": "One of the first great cities to fall silent."
          }
        ]
      ],
      [
        "Tiwanaku and Wari: the Andean empires before the Inca",
        [
          {
            "title": "World History Encyclopedia: Tiwanaku",
            "url": "https://www.worldhistory.org/Tiwanaku/",
            "note": "Free overview."
          },
          {
            "title": "World History Encyclopedia: Wari Civilization",
            "url": "https://www.worldhistory.org/Wari_Civilization/",
            "note": "Free overview."
          },
          {
            "title": "World History Encyclopedia: Moche Civilization",
            "url": "https://www.worldhistory.org/Moche_Civilization/",
            "note": "The coastal culture before them."
          }
        ]
      ],
      [
        "The Viking age, 793–1000",
        [
          {
            "title": "The Anglo-Saxon Chronicle (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/657",
            "note": "The English year-by-year record of the raids, from 793."
          },
          {
            "title": "Ibn Fadlan's account of the Rus' (Viking Answer Lady)",
            "url": "http://www.vikinganswerlady.com/ibn_fdln.shtml",
            "note": "The envoy on the Volga, 921–922, in translation."
          },
          {
            "title": "Kuitems et al., 'Evidence for European presence in the Americas in AD 1021' (Nature, 2021)",
            "url": "https://www.nature.com/articles/s41586-021-03972-8",
            "note": "The tree-ring dating of L'Anse aux Meadows."
          }
        ]
      ],
      [
        "Kievan Rus' and the baptism of 988",
        [
          {
            "title": "World History Encyclopedia: Kievan Rus",
            "url": "https://www.worldhistory.org/Kievan_Rus/",
            "note": "Free overview."
          },
          {
            "title": "Fordham: Byzantine Sources Page",
            "url": "https://sourcebooks.fordham.edu/halsall/byzantium/index.asp",
            "note": "See its section 'The Byzantine Commonwealth: Russia'."
          }
        ]
      ],
      [
        "The Polynesian voyages and the Austronesian settlement of Madagascar",
        [
          {
            "title": "Wilmshurst et al., 'High-precision radiocarbon dating shows recent and rapid initial human colonization of East Polynesia' (PNAS, 2011)",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3033267/",
            "note": "The 'short chronology'; free full text."
          },
          {
            "title": "Ioannidis et al., 'Native American gene flow into Polynesia predating Easter Island settlement' (Nature, 2020)",
            "url": "https://www.nature.com/articles/s41586-020-2487-2",
            "note": "The DNA evidence of contact."
          },
          {
            "title": "World History Encyclopedia: Polynesian Navigation & Settlement of the Pacific",
            "url": "https://www.worldhistory.org/article/1586/polynesian-navigation--settlement-of-the-pacific/",
            "note": "Free overview of the voyages."
          }
        ]
      ],
      [
        "Connections: the world in AD 1000",
        [
          {
            "title": "OpenStax, World History Vol. 1, 12.2: East-West Interactions in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-2-east-west-interactions-in-the-early-middle-ages",
            "note": "OpenStax World History Vol. 1. Further reading only: cited, not adapted. The Silk Roads and the Indian Ocean."
          },
          {
            "title": "Fordham Sourcebook: An Arab Ambassador in Constantinople, late 10th century",
            "url": "https://sourcebooks.fordham.edu/source/byz-arabambas.asp",
            "note": "Two worlds meeting around 1000."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 7 · The connected Middle Ages, 1000–1450",
    "lessons": [
      [
        "Map: the world in the year 1000",
        [
          {
            "title": "OpenStax World History Vol. 1, 12.1 The Indian Ocean World in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-1-the-indian-ocean-world-in-the-early-middle-ages",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "OpenStax World History Vol. 1, 13.1 The Post-Roman West in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/13-1-the-post-roman-west-in-the-early-middle-ages",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Fordham Medieval Sourcebook: Baghdad under the Abbasids",
            "url": "https://sourcebooks.fordham.edu/source/1000baghdad.asp",
            "note": "A description of the Abbasid capital."
          }
        ]
      ],
      [
        "The Great Schism of 1054",
        [
          {
            "title": "OpenStax World History Vol. 1, 13.3 Patriarch and Papacy: The Church and the Call to Crusade",
            "url": "https://openstax.org/books/world-history-volume-1/pages/13-3-patriarch-and-papacy-the-church-and-the-call-to-crusade",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Internet Medieval Sourcebook: Byzantium",
            "url": "https://sourcebooks.fordham.edu/byzantium/",
            "note": "Byzantine sources, including church relations with Rome."
          },
          {
            "title": "Anthony Kaldellis, The New Roman Empire: A History of Byzantium",
            "note": ". The Byzantine side of 1054 and 1204."
          }
        ]
      ],
      [
        "The Seljuk Turks and the battle of Manzikert, 1071",
        [
          {
            "title": "OpenStax World History Vol. 1, 13.2 The Seljuk Migration and the Call from the East",
            "url": "https://openstax.org/books/world-history-volume-1/pages/13-2-the-seljuk-migration-and-the-call-from-the-east",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Anna Komnene, The Alexiad (Fordham full text)",
            "url": "https://sourcebooks.fordham.edu/basis/AnnaComnena-Alexiad.asp",
            "note": "Alexios I's daughter on his reign after Manzikert."
          },
          {
            "title": "Warren Treadgold, A History of the Byzantine State and Society",
            "note": ". Manzikert and the civil wars that followed."
          }
        ]
      ],
      [
        "The First Crusade and the crusader states, 1095–1149",
        [
          {
            "title": "Fordham: Urban II, Speech at Clermont, Five Versions",
            "url": "https://sourcebooks.fordham.edu/source/urban2-5vers.asp",
            "note": "The five accounts side by side; all written after the crusade."
          },
          {
            "title": "Fordham: Fulcher of Chartres, Chronicle of the First Crusade",
            "url": "https://sourcebooks.fordham.edu/source/fulcher-cde.asp",
            "note": "An eyewitness chaplain."
          },
          {
            "title": "OpenStax World History Vol. 1, 13.4 The Crusading Movement",
            "url": "https://openstax.org/books/world-history-volume-1/pages/13-4-the-crusading-movement",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          }
        ]
      ],
      [
        "Saladin, the Third Crusade and the end of the crusader states",
        [
          {
            "title": "Fordham: The Capture of Jerusalem by Saladin, 1187",
            "url": "https://sourcebooks.fordham.edu/source/1187saladin.asp",
            "note": "Contemporary account."
          },
          {
            "title": "Fordham: Richard the Lionheart Makes Peace with Saladin, 1192",
            "url": "https://sourcebooks.fordham.edu/source/1192peace.asp",
            "note": "The Treaty of Jaffa from the sources."
          },
          {
            "title": "Fordham: Usamah ibn Munqidh on the Franks",
            "url": "https://sourcebooks.fordham.edu/source/usamah2.asp",
            "note": "A Syrian Muslim nobleman's memoir of living beside the crusaders."
          }
        ]
      ],
      [
        "The Fourth Crusade and the sack of Constantinople, 1204",
        [
          {
            "title": "Fordham: The Fourth Crusade 1204, Collected Sources",
            "url": "https://sourcebooks.fordham.edu/source/4cde.asp",
            "note": "Villehardouin, Clari, Choniates and papal letters."
          },
          {
            "title": "Fordham: Niketas Choniates, The Capture of Constantinople",
            "url": "https://sourcebooks.fordham.edu/source/choniates1.asp",
            "note": "The Byzantine eyewitness."
          },
          {
            "title": "Fordham: Robert of Clari, The Capture of Constantinople",
            "url": "https://sourcebooks.fordham.edu/source/clari1.asp",
            "note": "A knight's account."
          }
        ]
      ],
      [
        "Lords, vassals and peasants: the argument over \"feudalism\"",
        [
          {
            "title": "Fordham Medieval Sourcebook: Crisis, Recovery, Feudalism?",
            "url": "https://sourcebooks.fordham.edu/sbook1i.asp",
            "note": "Sources on lordship, vassalage and the debate over the term."
          },
          {
            "title": "Fordham: Peasant Servitude and Obligations, rulings of Louis VI and Louis VII",
            "url": "https://sourcebooks.fordham.edu/source/12peasantobligations-france-rbarton.asp",
            "note": "What serfs owed, in 12th-century France."
          },
          {
            "title": "Susan Reynolds, Fiefs and Vassals: The Medieval Evidence Reinterpreted (1994)",
            "note": "The main case against the feudal model."
          }
        ]
      ],
      [
        "Towns, merchants and guilds in medieval Europe",
        [
          {
            "title": "Fordham: The Charter of Lorris",
            "url": "https://sourcebooks.fordham.edu/source/lorris.asp",
            "note": "A 12th-century French town charter, much copied."
          },
          {
            "title": "Fordham: The Hanse of Utrecht, 1251",
            "url": "https://sourcebooks.fordham.edu/source/1251Utrecht.asp",
            "note": "A merchant association's privileges."
          }
        ]
      ],
      [
        "Popes against kings: from Canossa to Avignon",
        [
          {
            "title": "Fordham: Gregory VII, Dictatus Papae (1075)",
            "url": "https://sourcebooks.fordham.edu/source/g7-dictpap.asp",
            "note": "The papal claims in 27 short sentences."
          },
          {
            "title": "Fordham: Boniface VIII, Unam Sanctam (1302)",
            "url": "https://sourcebooks.fordham.edu/source/b8-unam.asp",
            "note": "The high-water mark of papal claims."
          },
          {
            "title": "Fordham: Magna Carta (1215)",
            "url": "https://sourcebooks.fordham.edu/source/magnacarta.asp",
            "note": "Full text in translation."
          }
        ]
      ],
      [
        "The first universities and the recovery of Aristotle",
        [
          {
            "title": "Fordham: The Great Schism, The University of Paris on the Schism",
            "url": "https://sourcebooks.fordham.edu/source/grtschism2.asp",
            "note": "The university acting as a power in the Church, 1390s."
          },
          {
            "title": "George Makdisi, The Rise of Colleges (1981)",
            "note": "The case for Islamic parallels to the university."
          }
        ]
      ],
      [
        "The Hundred Years' War, 1337–1453",
        [
          {
            "title": "Fordham: Froissart, the battles of Crécy (1346) and Poitiers (1356)",
            "url": "https://sourcebooks.fordham.edu/source/froissart1.asp",
            "note": "The great chronicler of the war's first half."
          },
          {
            "title": "Fordham: The Trial of Joan of Arc (1431)",
            "url": "https://sourcebooks.fordham.edu/source/1431joantrial.asp",
            "note": "Excerpts from the trial record."
          },
          {
            "title": "Fordham: Transcript of the Trial of Joan of Arc",
            "url": "https://sourcebooks.fordham.edu/basis/joanofarc-trial.asp",
            "note": "The fuller transcript."
          }
        ]
      ],
      [
        "Song China: the richest state on earth, 960–1279",
        [
          {
            "title": "OpenStax World History Vol. 1, 14.1 Song China and the Steppe Peoples",
            "url": "https://openstax.org/books/world-history-volume-1/pages/14-1-song-china-and-the-steppe-peoples",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Asia for Educators (Columbia): Song Dynasty China",
            "url": "http://afe.easia.columbia.edu/song/",
            "note": "Free illustrated units on Song society and economy."
          }
        ]
      ],
      [
        "Printing, gunpowder and the compass in Song China",
        [
          {
            "title": "Asia for Educators (Columbia): Song Dynasty China",
            "url": "http://afe.easia.columbia.edu/song/",
            "note": "Includes Song technology and printing."
          },
          {
            "title": "Fordham Internet East Asian History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/eastasia/eastasiasbook.asp",
            "note": "Sources and images for Song and Yuan China and Korea."
          }
        ]
      ],
      [
        "Japan's shoguns: Kamakura and Ashikaga, 1185–1450",
        [
          {
            "title": "Asia for Educators (Columbia): Mongols in World History",
            "url": "https://afe.easia.columbia.edu/mongols/index.htm",
            "note": "Includes the Mongol invasions of Japan, 1274 and 1281."
          },
          {
            "title": "The Cambridge History of Japan, vol. 3: Medieval Japan",
            "note": ". Kamakura and Muromachi in depth."
          }
        ]
      ],
      [
        "The Khmer Empire and the city of Angkor",
        [
          {
            "title": "OpenStax World History Vol. 1, 12.1 The Indian Ocean World in the Early Middle Ages",
            "url": "https://openstax.org/books/world-history-volume-1/pages/12-1-the-indian-ocean-world-in-the-early-middle-ages",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Zhou Daguan, A Record of Cambodia: The Land and Its People, trans. Peter Harris (2007)",
            "note": "The only eyewitness account of Angkor, 1296–97."
          }
        ]
      ],
      [
        "The Delhi Sultanate, 1206–1398",
        [
          {
            "title": "Fordham Internet Indian History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/india/indiasbook.asp",
            "note": "Sources for the sultanate period."
          },
          {
            "title": "Ibn Battuta, Travels in Asia and Africa 1325–1354 (Gibb, 1929), excerpts",
            "url": "https://sourcebooks.fordham.edu/source/1354-ibnbattuta.asp",
            "note": "Internet Medieval Sourcebook. The Gibb translation used in the primary-source lesson."
          },
          {
            "title": "Fisher, A History of India",
            "note": ". The sultanate and the south."
          }
        ]
      ],
      [
        "Temüjin becomes Genghis Khan, 1162–1227",
        [
          {
            "title": "Fordham: Ibn al-Athir, On the Tatars, 1220–21",
            "url": "https://sourcebooks.fordham.edu/source/1220al-Athir-mongols.asp",
            "note": "A contemporary Muslim historian on the Mongol invasion of Khwarazm."
          },
          {
            "title": "OpenStax World History Vol. 1, 14.2 Chinggis Khan and the Early Mongol Empire",
            "url": "https://openstax.org/books/world-history-volume-1/pages/14-2-chinggis-khan-and-the-early-mongol-empire",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "John Man, The Mongol Empire",
            "note": "."
          }
        ]
      ],
      [
        "The Mongol conquests and the four khanates, 1227–1260s",
        [
          {
            "title": "OpenStax World History Vol. 1, 14.3 The Mongol Empire Fragments",
            "url": "https://openstax.org/books/world-history-volume-1/pages/14-3-the-mongol-empire-fragments",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Asia for Educators (Columbia): Mongols in World History",
            "url": "https://afe.easia.columbia.edu/mongols/index.htm",
            "note": "Free units on the conquests and the khanates."
          }
        ]
      ],
      [
        "The sack of Baghdad, 1258, and Ain Jalut",
        [
          {
            "title": "De Re Militari: The Mongol Invasion of the Middle East (1258–1260), according to Rashid al-Din",
            "url": "https://deremilitari.org/2013/03/jumiut-tawarikh-the-conquest-of-aleppo-and-the-surrender-of-damascus-in-1259-1260/",
            "note": "The Ilkhans' own historian on the campaign into Syria."
          },
          {
            "title": "OpenStax World History Vol. 1, 14.3 The Mongol Empire Fragments",
            "url": "https://openstax.org/books/world-history-volume-1/pages/14-3-the-mongol-empire-fragments",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          }
        ]
      ],
      [
        "Pax Mongolica: roads, relay posts and a debated peace",
        [
          {
            "title": "Fordham: The Monk of Kublai Khan (Rabban Sauma)",
            "url": "https://sourcebooks.fordham.edu/eastasia/13bar-sauma-nestorianpilgrim.asp",
            "note": "The journey west from China to Rome and Paris."
          },
          {
            "title": "Silk Road Seattle (University of Washington): historical texts",
            "url": "https://depts.washington.edu/silkroad/texts/texts.html",
            "note": "Free translations of travellers' accounts, including Rubruck and Carpini."
          }
        ]
      ],
      [
        "Kublai Khan and Yuan China, 1271–1368",
        [
          {
            "title": "The Travels of Marco Polo, vol. 1 (Yule translation, Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10636",
            "note": "Public domain. Book 2 describes Kublai's court."
          },
          {
            "title": "Asia for Educators (Columbia): Mongols in World History",
            "url": "https://afe.easia.columbia.edu/mongols/index.htm",
            "note": "The Yuan dynasty unit."
          }
        ]
      ],
      [
        "The Golden Horde and the rise of Moscow",
        [
          {
            "title": "OpenStax World History Vol. 1, 14.3 The Mongol Empire Fragments",
            "url": "https://openstax.org/books/world-history-volume-1/pages/14-3-the-mongol-empire-fragments",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Charles Halperin, Russia and the Golden Horde (1985)",
            "note": "The 'ideology of silence' and the debate on Mongol influence."
          }
        ]
      ],
      [
        "Marco Polo and Ibn Battuta: two travellers and their books",
        [
          {
            "title": "The Travels of Marco Polo, vol. 1 (Yule translation, Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10636",
            "note": "Public domain."
          },
          {
            "title": "The Travels of Marco Polo, vol. 2 (Yule translation, Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/12410",
            "note": "Public domain."
          },
          {
            "title": "Ibn Battuta, Travels in Asia and Africa 1325–1354 (Gibb, 1929), excerpts",
            "url": "https://sourcebooks.fordham.edu/source/1354-ibnbattuta.asp",
            "note": "Internet Medieval Sourcebook. The Gibb translation used in the primary-source lesson."
          }
        ]
      ],
      [
        "Mali: Sundiata and Mansa Musa",
        [
          {
            "title": "Boston University African Studies Center: Mali and Mansa Musa",
            "url": "https://www.bu.edu/africa/outreach/teachingresources/history/ancient-to-medieval-history/k_o_mali/",
            "note": "Free teaching unit."
          },
          {
            "title": "OpenStax World History Vol. 1, 15.3 The People of the Sahel",
            "url": "https://openstax.org/books/world-history-volume-1/pages/15-3-the-people-of-the-sahel",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "D. T. Niane, Sundiata: An Epic of Old Mali (1960)",
            "note": "The best-known written version of the griots' epic."
          }
        ]
      ],
      [
        "Primary source: Ibn Battuta judges Mali, 1352",
        [
          {
            "title": "Ibn Battuta, Travels in Asia and Africa 1325–1354 (Gibb, 1929), excerpts",
            "url": "https://sourcebooks.fordham.edu/source/1354-ibnbattuta.asp",
            "note": "Internet Medieval Sourcebook. The Gibb translation used in the primary-source lesson."
          },
          {
            "title": "Ibn Battuta, Travels in Asia and Africa (Gibb, 1929), full scan at the Internet Archive",
            "url": "https://archive.org/details/in.ernet.dli.2015.62617",
            "note": "The 1929 edition the Sourcebook excerpts."
          }
        ]
      ],
      [
        "Mapungubwe and Great Zimbabwe",
        [
          {
            "title": "South African History Online: Mapungubwe",
            "url": "https://www.sahistory.org.za/place/mapungubwe",
            "note": "Free. For the South African thread, see the South African Politics curriculum."
          },
          {
            "title": "OpenStax World History Vol. 1, 15.2 Medieval Sub-Saharan Africa",
            "url": "https://openstax.org/books/world-history-volume-1/pages/15-2-medieval-sub-saharan-africa",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          }
        ]
      ],
      [
        "The Swahili coast: Kilwa and the monsoon trade",
        [
          {
            "title": "Boston University African Studies Center: The Swahili Coast and Indian Ocean Trade",
            "url": "https://www.bu.edu/africa/outreach/teachingresources/history/ancient-to-medieval-history/indian/",
            "note": "Free teaching unit."
          },
          {
            "title": "Ibn Battuta, Travels in Asia and Africa 1325–1354 (Gibb, 1929), excerpts",
            "url": "https://sourcebooks.fordham.edu/source/1354-ibnbattuta.asp",
            "note": "Internet Medieval Sourcebook. The Gibb translation used in the primary-source lesson."
          },
          {
            "title": "OpenStax World History Vol. 1, 15.2 Medieval Sub-Saharan Africa",
            "url": "https://openstax.org/books/world-history-volume-1/pages/15-2-medieval-sub-saharan-africa",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          }
        ]
      ],
      [
        "Ethiopia: Lalibela's churches and the Solomonic kings",
        [
          {
            "title": "OpenStax World History Vol. 1, 15.1 Culture and Society in Medieval Africa",
            "url": "https://openstax.org/books/world-history-volume-1/pages/15-1-culture-and-society-in-medieval-africa",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Fordham Internet African History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/africa/africasbook.asp",
            "note": "Includes a section on Ethiopia and Christianity."
          },
          {
            "title": "David Phillipson, Ancient Churches of Ethiopia (2009)",
            "note": "The archaeological case on Lalibela's dating."
          }
        ]
      ],
      [
        "Cahokia and the peoples of North America, 1000–1350",
        [
          {
            "title": "Cahokia Mounds State Historic Site",
            "url": "https://cahokiamounds.org/",
            "note": "The site's own pages."
          },
          {
            "title": "Chaco Culture National Historical Park (US National Park Service)",
            "url": "https://www.nps.gov/chcu/index.htm",
            "note": "Free."
          },
          {
            "title": "Barnhart, Ancient Civilizations of North America",
            "note": ". Cahokia and the Puebloans."
          }
        ]
      ],
      [
        "Tenochtitlan and the rise of the Inca",
        [
          {
            "title": "Códice Mendoza (INAH, Mexico): the digital Codex Mendoza",
            "url": "https://codicemendoza.inah.gob.mx/",
            "note": "A 16th-century Mexica-Spanish codex: the founding of Tenochtitlan and the tribute lists."
          },
          {
            "title": "W. H. Prescott, History of the Conquest of Mexico, vol. 1 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/59755",
            "note": "Public domain (1843). Book 1 surveys Aztec society; dated in method and judgements, read with care."
          },
          {
            "title": "W. H. Prescott, History of the Conquest of Peru (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/1209",
            "note": "Public domain (1847). Opens with the Inca before the Spanish; dated, read with care."
          }
        ]
      ],
      [
        "The Black Death, 1346–1353",
        [
          {
            "title": "Fordham: Boccaccio, Decameron, Introduction, on the Black Death",
            "url": "https://sourcebooks.fordham.edu/source/boccacio2.asp",
            "note": "Florence in 1348."
          },
          {
            "title": "Fordham: Ibn Battuta, The Plague in Damascus, 1348",
            "url": "https://sourcebooks.fordham.edu/source/1354ibnbattuta-plague.asp",
            "note": "The plague in the Islamic world, seen by an eyewitness."
          },
          {
            "title": "Fordham: The Black Death and the Jews, 1348–49",
            "url": "https://sourcebooks.fordham.edu/jewish/1348-jewsblackdeath.asp",
            "note": "Sources on the massacres, including Strasbourg."
          }
        ]
      ],
      [
        "The Ming dynasty and the voyages of Zheng He",
        [
          {
            "title": "OpenStax World History Vol. 1, 17.2 From the Mamluks to Ming China",
            "url": "https://openstax.org/books/world-history-volume-1/pages/17-2-from-the-mamluks-to-ming-china",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Fordham: Zhu Yuanzhang, Manifesto of Accession as First Ming Emperor",
            "url": "https://sourcebooks.fordham.edu/eastasia/1372mingmanf.html",
            "note": "The Hongwu emperor's own words."
          }
        ]
      ],
      [
        "The rise of the Ottomans, 1300–1450",
        [
          {
            "title": "OpenStax World History Vol. 1, 17.1 The Ottomans and the Mongols",
            "url": "https://openstax.org/books/world-history-volume-1/pages/17-1-the-ottomans-and-the-mongols",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "De Re Militari: Sources on Tamerlane, including the Battle of Ankara (1402)",
            "url": "https://deremilitari.org/2018/04/sources-on-tamerlane-1336-1405-including-the-battle-of-angora-1402/",
            "note": "Translated accounts of Timur and Ankara."
          },
          {
            "title": "Cemal Kafadar, Between Two Worlds: The Construction of the Ottoman State (1995)",
            "note": "The modern synthesis on Ottoman origins."
          }
        ]
      ],
      [
        "The fall of Constantinople, 1453",
        [
          {
            "title": "Ballandalus: Michael Kritovoulos of Imbros on the Fall of Constantinople",
            "url": "https://ballandalus.wordpress.com/2016/05/29/michael-kritovolous-of-imbros-d-1470-on-the-fall-of-constantinople-1453-2/",
            "note": "A Greek historian who served Mehmed II."
          },
          {
            "title": "John Julius Norwich, A Short History of Byzantium",
            "note": ". The last chapters tell the siege."
          }
        ]
      ],
      [
        "Connections: the world in 1450",
        [
          {
            "title": "OpenStax World History Vol. 1, 16.4 The Long-Term Effects of Global Transformation",
            "url": "https://openstax.org/books/world-history-volume-1/pages/16-4-the-long-term-effects-of-global-transformation",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "OpenStax World History Vol. 2, 2.2 The Malacca Sultanate",
            "url": "https://openstax.org/books/world-history-volume-2/pages/2-2-the-malacca-sultanate",
            "note": "Free to read; CC BY-NC-SA 4.0. Further reading only, not adapted."
          },
          {
            "title": "Janet Abu-Lughod, Before European Hegemony: The World System A.D. 1250–1350 (1989)",
            "note": "The eight circuits of the 13th-century world."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 8 · The world joined, 1450–1750",
    "lessons": [
      [
        "Map: the world in 1450",
        [
          {
            "title": "OpenStax, World History Vol. 1, ch. 17: The Ottomans, the Mamluks, and the Ming",
            "url": "https://openstax.org/books/world-history-volume-1/pages/17-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, ch. 1: Understanding the Past (Connections across Continents, 1500–1800)",
            "url": "https://openstax.org/books/world-history-volume-2/pages/1-introduction",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The Italian Renaissance and the humanists",
        [
          {
            "title": "Niccolò Machiavelli, The Prince, tr. W. K. Marriott",
            "url": "https://www.gutenberg.org/ebooks/1232",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Giorgio Vasari, Lives of the Most Eminent Painters, Sculptors and Architects, vol. 1, tr. Gaston du C. de Vere",
            "url": "https://www.gutenberg.org/ebooks/25326",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "William Manchester, A World Lit Only by Fire (1992)",
            "note": ". A popular, vivid account; medievalists find its picture of the Middle Ages too dark."
          }
        ]
      ],
      [
        "Gutenberg and the printing press",
        [
          {
            "title": "Desiderius Erasmus, The Praise of Folly",
            "url": "https://www.gutenberg.org/ebooks/9371",
            "note": "Public domain, Project Gutenberg. One of the first best-sellers of print."
          },
          {
            "title": "Elizabeth Eisenstein, The Printing Revolution in Early Modern Europe (1983)",
            "note": "The shorter version of her 1979 argument."
          }
        ]
      ],
      [
        "Ming China after the treasure fleets",
        [
          {
            "title": "OpenStax, World History Vol. 1, 17.2: From the Mamluks to Ming China",
            "url": "https://openstax.org/books/world-history-volume-1/pages/17-2-from-the-mamluks-to-ming-china",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 2.3: Exchange in East Asia",
            "url": "https://openstax.org/books/world-history-volume-2/pages/2-3-exchange-in-east-asia",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Juan González de Mendoza, The History of the Great and Mighty Kingdom of China (1585), vol. 1",
            "url": "https://www.gutenberg.org/ebooks/39009",
            "note": "Public domain, Project Gutenberg. The first European best-seller on Ming China."
          }
        ]
      ],
      [
        "The Portuguese round Africa",
        [
          {
            "title": "A Journal of the First Voyage of Vasco da Gama, 1497–1499, tr. E. G. Ravenstein (1898)",
            "url": "https://www.gutenberg.org/ebooks/46440",
            "note": "Public domain, Project Gutenberg. An eyewitness log by a crew member; the author is uncertain (Álvaro Velho is often suggested)."
          },
          {
            "title": "Gomes Eanes de Zurara, The Chronicle of the Discovery and Conquest of Guinea, vol. 1",
            "url": "https://www.gutenberg.org/ebooks/35738",
            "note": "Public domain, Project Gutenberg. Includes the 1444 sale of captives at Lagos."
          },
          {
            "title": "OpenStax, World History Vol. 2, 3.3: The Swahili Coast",
            "url": "https://openstax.org/books/world-history-volume-2/pages/3-3-the-swahili-coast",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Columbus and 1492",
        [
          {
            "title": "Christopher Columbus: Extracts from Journal (1492)",
            "url": "https://sourcebooks.fordham.edu/source/columbus1.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Select Letters of Christopher Columbus, ed. and tr. R. H. Major (Hakluyt Society)",
            "url": "https://www.gutenberg.org/ebooks/77820",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Library of Congress, 1492: An Ongoing Voyage",
            "url": "https://www.loc.gov/exhibits/1492/",
            "note": "Online exhibition on the Americas, Europe and Africa around 1492."
          }
        ]
      ],
      [
        "The conquest of Mexico, 1519–1521",
        [
          {
            "title": "An Aztec Account of the Conquest of Mexico (from León-Portilla, The Broken Spears)",
            "url": "https://sourcebooks.fordham.edu/mod/aztecs1.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Hernán Cortés, from the Second Letter to Charles V (1520)",
            "url": "https://sourcebooks.fordham.edu/mod/1520cortes.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Bernal Díaz del Castillo, Memoirs, vol. 1, tr. John Ingram Lockhart",
            "url": "https://www.gutenberg.org/ebooks/32474",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "The conquest of the Inca, 1532–1572",
        [
          {
            "title": "Pedro de Cieza de León, Chronicles of the Incas",
            "url": "https://sourcebooks.fordham.edu/mod/1540cieza.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Pedro Sarmiento de Gamboa, History of the Incas (1572), tr. Clements Markham",
            "url": "https://www.gutenberg.org/ebooks/20218",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "William H. Prescott, History of the Conquest of Peru (1847)",
            "url": "https://www.gutenberg.org/ebooks/1209",
            "note": "Public domain, Project Gutenberg. A classic narrative; dated in its views of the Inca."
          }
        ]
      ],
      [
        "The Columbian Exchange",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.2: The Rise of a Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-2-the-rise-of-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Alfred W. Crosby, The Columbian Exchange (1972)",
            "note": "The book that named it."
          }
        ]
      ],
      [
        "The great dying in the Americas",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.1: European Colonization in the Americas",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-1-european-colonization-in-the-americas",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Andrés Reséndez, The Other Slavery (2016)",
            "note": "The case that enslavement, not disease alone, drove the collapse."
          }
        ]
      ],
      [
        "Spain's American empire and Las Casas",
        [
          {
            "title": "Bartolomé de las Casas, A Brief Account of the Destruction of the Indies",
            "url": "https://www.gutenberg.org/ebooks/20321",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Wikisource: Bartolomé de las Casas",
            "url": "https://en.wikisource.org/wiki/Author:Bartolom%C3%A9_de_las_Casas",
            "note": "Free texts by and about him."
          },
          {
            "title": "Internet Modern History Sourcebook: Colonial Latin America",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook08.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          }
        ]
      ],
      [
        "The Ottoman Empire under Suleiman the Magnificent",
        [
          {
            "title": "OpenStax, World History Vol. 2, 4.2: The Ottoman Empire",
            "url": "https://openstax.org/books/world-history-volume-2/pages/4-2-the-ottoman-empire",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "The Life and Letters of Ogier Ghiselin de Busbecq, vol. 1",
            "url": "https://www.gutenberg.org/ebooks/53629",
            "note": "Public domain, Project Gutenberg. Letters of the Habsburg envoy to Suleiman's court."
          },
          {
            "title": "Andrew Wheatcroft, Infidels (2003)",
            "note": ". Christian–Muslim conflict, including the Ottoman wars."
          }
        ]
      ],
      [
        "Safavid Iran: Ismail and Shah Abbas",
        [
          {
            "title": "OpenStax, World History Vol. 2, 4.3: The Safavid Empire",
            "url": "https://openstax.org/books/world-history-volume-2/pages/4-3-the-safavid-empire",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet Islamic History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/islam/islamsbook.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          }
        ]
      ],
      [
        "The Mughals from Babur to Akbar",
        [
          {
            "title": "The Bābur-nāma in English (Memoirs of Bābur), tr. Annette S. Beveridge",
            "url": "https://www.gutenberg.org/ebooks/44608",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "OpenStax, World History Vol. 2, 2.1: India and International Connections",
            "url": "https://openstax.org/books/world-history-volume-2/pages/2-1-india-and-international-connections",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Michael H. Fisher, A Short History of the Mughal Empire (2016)",
            "note": "A compact modern account; Fisher's History of India covers the same ground."
          }
        ]
      ],
      [
        "Luther and the Protestant Reformation",
        [
          {
            "title": "OpenStax, World History Vol. 2, 5.1: The Protestant Reformation",
            "url": "https://openstax.org/books/world-history-volume-2/pages/5-1-the-protestant-reformation",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Martin Luther, the Ninety-five Theses (1517)",
            "url": "https://sourcebooks.fordham.edu/source/luther95.txt",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Internet Modern History Sourcebook: Reformation",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook02.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          }
        ]
      ],
      [
        "Calvin, Henry VIII and the spread of Protestantism",
        [
          {
            "title": "John Calvin, Institutes of the Christian Religion, vol. 1, tr. John Allen",
            "url": "https://www.gutenberg.org/ebooks/45001",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Internet Modern History Sourcebook: Reformation",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook02.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          }
        ]
      ],
      [
        "The Catholic Reformation: Trent and the Jesuits",
        [
          {
            "title": "Internet Modern History Sourcebook: Reformation (Catholic Reformation section)",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook02.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "John W. O'Malley, Trent and All That (2000)",
            "note": "On what to call the Catholic response, and why the name matters."
          }
        ]
      ],
      [
        "Muscovy and Ivan the Terrible",
        [
          {
            "title": "Janet Martin, Medieval Russia, 980–1584 (2nd ed. 2007)",
            "note": "A standard account to the death of Ivan IV."
          },
          {
            "title": "Isabel de Madariaga, Ivan the Terrible (2005)",
            "note": "A full modern biography."
          }
        ]
      ],
      [
        "Songhai and the Moroccan invasion of 1591",
        [
          {
            "title": "OpenStax, World History Vol. 2, 3.2: The Songhai Empire",
            "url": "https://openstax.org/books/world-history-volume-2/pages/3-2-the-songhai-empire",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Boston University African Studies Center: Kingdom of Songhai",
            "url": "https://www.bu.edu/africa/outreach/teachingresources/history/ancient-to-medieval-history/k_o_songhay/",
            "note": "Free teaching overview."
          },
          {
            "title": "Internet African History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/africa/africasbook.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          }
        ]
      ],
      [
        "Potosí and the silver that circled the world",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.2: The Rise of a Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-2-the-rise-of-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "The First Voyage Round the World by Magellan, from Pigafetta and others, tr. Lord Stanley of Alderley (Hakluyt Society)",
            "url": "https://www.gutenberg.org/ebooks/74723",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "The Wars of Religion in France and the Netherlands",
        [
          {
            "title": "Henry M. Baird, History of the Rise of the Huguenots, vol. 1",
            "url": "https://www.gutenberg.org/ebooks/22762",
            "note": "Public domain, Project Gutenberg. A 19th-century Protestant narrative; read with that in mind."
          },
          {
            "title": "John Lothrop Motley, The Rise of the Dutch Republic (1555–66)",
            "url": "https://www.gutenberg.org/ebooks/4811",
            "note": "Public domain, Project Gutenberg. A famous 19th-century narrative, strongly anti-Spanish."
          }
        ]
      ],
      [
        "Tokugawa Japan",
        [
          {
            "title": "Diary of Richard Cocks, Cape-Merchant in the English Factory in Japan, 1615–1622, vol. 1",
            "url": "https://www.gutenberg.org/ebooks/46803",
            "note": "Public domain, Project Gutenberg. An English East India Company merchant in early Tokugawa Japan."
          },
          {
            "title": "Andrew Gordon, A Modern History of Japan",
            "note": ". Opens with the Tokugawa order."
          },
          {
            "title": "The Cambridge History of Japan, vol. 4: Early Modern Japan",
            "note": "(the Cambridge History of Japan)."
          }
        ]
      ],
      [
        "The Thirty Years' War and the Peace of Westphalia",
        [
          {
            "title": "Avalon Project (Yale): Treaty of Westphalia (Münster, 1648)",
            "url": "https://avalon.law.yale.edu/17th_century/westphal.asp",
            "note": "The treaty text in English."
          },
          {
            "title": "Samuel Rawson Gardiner, The Thirty Years' War, 1618–1648",
            "url": "https://www.gutenberg.org/ebooks/40082",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Peter H. Wilson, Europe's Tragedy: A History of the Thirty Years War (2009)",
            "note": "The standard modern history."
          }
        ]
      ],
      [
        "The fall of the Ming and the Qing conquest",
        [
          {
            "title": "OpenStax, World History Vol. 2, 2.3: Exchange in East Asia",
            "url": "https://openstax.org/books/world-history-volume-2/pages/2-3-exchange-in-east-asia",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet East Asian History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/eastasia/eastasiasbook.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Frederic Wakeman Jr., The Great Enterprise (1985)",
            "note": "The detailed history of the Manchu conquest."
          }
        ]
      ],
      [
        "The Atlantic slave trade: scale and the Middle Passage",
        [
          {
            "title": "SlaveVoyages: Trans-Atlantic Slave Trade estimates",
            "url": "https://www.slavevoyages.org/assessment/estimates",
            "note": "The database behind the numbers in this lesson; free."
          },
          {
            "title": "OpenStax, World History Vol. 2, 5.4: The Atlantic Slave Trade",
            "url": "https://openstax.org/books/world-history-volume-2/pages/5-4-the-atlantic-slave-trade",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "International Slavery Museum, Liverpool",
            "url": "https://www.liverpoolmuseums.org.uk/international-slavery-museum",
            "note": "Museum site with free online material."
          }
        ]
      ],
      [
        "Kongo, Benin, Dahomey and Asante",
        [
          {
            "title": "Internet African History Sourcebook (includes the impact of slavery)",
            "url": "https://sourcebooks.fordham.edu/africa/africasbook.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "John Thornton, Africa and Africans in the Making of the Atlantic World, 1400–1800 (2nd ed. 1998)",
            "note": "The case for African control of the coastal trade."
          },
          {
            "title": "Robin Law, The Slave Coast of West Africa, 1550–1750 (1991)",
            "note": "Dahomey, Whydah and Agaja's conquests."
          }
        ]
      ],
      [
        "Primary source: Olaudah Equiano on the slave ship",
        [
          {
            "title": "Olaudah Equiano, The Interesting Narrative of the Life of Olaudah Equiano (1789)",
            "url": "https://www.gutenberg.org/ebooks/15399",
            "note": "Public domain, Project Gutenberg. The text quoted in this lesson."
          },
          {
            "title": "Wikisource: Olaudah Equiano",
            "url": "https://en.wikisource.org/wiki/Author:Olaudah_Equiano",
            "note": "Free texts."
          },
          {
            "title": "Vincent Carretta, Equiano, the African: Biography of a Self-Made Man (2005)",
            "note": "The biography that raised the birthplace question."
          }
        ]
      ],
      [
        "The East India companies and the Dutch at the Cape",
        [
          {
            "title": "OpenStax, World History Vol. 2, 2.2: The Malacca Sultanate",
            "url": "https://openstax.org/books/world-history-volume-2/pages/2-2-the-malacca-sultanate",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "De VOCsite",
            "url": "https://www.vocsite.nl/",
            "note": "Dutch-language site on the VOC: ships, posts and people."
          },
          {
            "title": "The Cambridge History of South Africa, vol. 1",
            "note": ". The Cape after 1652, in depth; see the South African Politics curriculum."
          }
        ]
      ],
      [
        "The colonies of the Americas to 1750",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.1: European Colonization in the Americas",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-1-european-colonization-in-the-americas",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "William Bradford, History of the Plymouth Settlement, 1608–1650",
            "url": "https://www.gutenberg.org/ebooks/69871",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Internet Modern History Sourcebook: Colonial North America",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook07.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          }
        ]
      ],
      [
        "The Mughals from Jahangir to Aurangzeb",
        [
          {
            "title": "Richard Garbe, Akbar, Emperor of India",
            "url": "https://www.gutenberg.org/ebooks/14134",
            "note": "Public domain, Project Gutenberg. Short older study; background to the later reigns."
          },
          {
            "title": "Internet Indian History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/india/indiasbook.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Audrey Truschke, Aurangzeb: The Man and the Myth (2017)",
            "note": "A short revisionist account; read alongside its critics."
          }
        ]
      ],
      [
        "Peter the Great and the Russian Empire",
        [
          {
            "title": "Lindsey Hughes, Russia in the Age of Peter the Great (1998)",
            "note": "The standard scholarly account of the reforms."
          },
          {
            "title": "Robert K. Massie, Peter the Great: His Life and World (1980)",
            "note": "A long, readable biography."
          }
        ]
      ],
      [
        "The scientific revolution",
        [
          {
            "title": "Internet Modern History Sourcebook: Scientific Revolution",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook09.asp",
            "note": "Internet History Sourcebooks (Fordham): free primary sources."
          },
          {
            "title": "Galileo Galilei, The Sidereal Messenger (1610), tr. E. S. Carlos (1880)",
            "url": "https://www.gutenberg.org/ebooks/46036",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Royal Society: History of the Royal Society",
            "url": "https://royalsociety.org/about-us/who-we-are/history/",
            "note": "The society founded in 1660."
          }
        ]
      ],
      [
        "Connections: the world joined by 1750",
        [
          {
            "title": "OpenStax, World History Vol. 2, 5.3: The Mercantilist Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/5-3-the-mercantilist-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 6.2: The Rise of a Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-2-the-rise-of-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Kenneth Pomeranz, The Great Divergence (2000)",
            "note": "The argument that opens the next stage."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 9 · Revolutions and empires, 1750–1914",
    "lessons": [
      [
        "Map: the world in 1750",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.2: The Rise of a Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-2-the-rise-of-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 6.1: European Colonization in the Americas",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-1-european-colonization-in-the-americas",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Our World in Data: World Population Growth",
            "url": "https://ourworldindata.org/world-population-growth",
            "note": "CC BY. Population estimates over the long run."
          }
        ]
      ],
      [
        "The Enlightenment: reason, rights and their limits",
        [
          {
            "title": "OpenStax, World History Vol. 2, 7.1: The Enlightenment",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-1-the-enlightenment",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 7.2: The Exchange of Ideas in the Public Sphere",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-2-the-exchange-of-ideas-in-the-public-sphere",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Kant, 'What is Enlightenment?' (1784), Fordham Modern History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/mod/kant-whatis.asp",
            "note": "Free primary source."
          }
        ]
      ],
      [
        "The Seven Years' War, 1756–1763: a war of empires on four continents",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.2: The Rise of a Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-2-the-rise-of-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Winston Churchill, A History of the English-Speaking Peoples, vol. 3",
            "note": ". Churchill's narrative of the war in America and India."
          }
        ]
      ],
      [
        "The American Revolution, 1763–1791",
        [
          {
            "title": "OpenStax, World History Vol. 2, 7.3: Revolutions: America, France, and Haiti",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-3-revolutions-america-france-and-haiti",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Declaration of Independence: a transcription (US National Archives)",
            "url": "https://www.archives.gov/founding-docs/declaration-transcript",
            "note": "Free primary source."
          },
          {
            "title": "Thomas Paine, Common Sense (1776)",
            "url": "https://www.gutenberg.org/ebooks/147",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "The French Revolution, 1789–1799: from the Bastille to the Terror",
        [
          {
            "title": "OpenStax, World History Vol. 2, 7.3: Revolutions: America, France, and Haiti",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-3-revolutions-america-france-and-haiti",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Thomas Paine, The Rights of Man (1791–1792)",
            "url": "https://www.gutenberg.org/ebooks/3742",
            "note": "Public domain, Project Gutenberg. Paine's answer to Burke."
          },
          {
            "title": "Marxists Internet Archive: the French Revolution",
            "url": "https://www.marxists.org/history/france/revolution/",
            "note": "Free collection of documents and texts."
          }
        ]
      ],
      [
        "Primary source: the Declaration of the Rights of Man, 1789",
        [
          {
            "title": "Declaration of the Rights of Man and Citizen, tr. Frank Maloy Anderson (1908), Wikisource",
            "url": "https://en.wikisource.org/wiki/The_Constitutions_and_Other_Select_Documents_Illustrative_of_the_History_of_France,_1789%E2%80%931907/15",
            "note": "Public domain. The translation quoted in the primary-source lesson."
          },
          {
            "title": "OpenStax, World History Vol. 2, 7.3: Revolutions: America, France, and Haiti",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-3-revolutions-america-france-and-haiti",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Mary Wollstonecraft, A Vindication of the Rights of Woman (1792)",
            "url": "https://www.gutenberg.org/ebooks/3420",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Napoleon's empire, 1799–1815",
        [
          {
            "title": "OpenStax, World History Vol. 2, 7.4: Nationalism, Liberalism, Conservatism, and the Political Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-4-nationalism-liberalism-conservatism-and-the-political-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "National Army Museum: the Battle of Waterloo",
            "url": "https://www.nam.ac.uk/explore/battle-waterloo",
            "note": "Free. The battle and its armies."
          }
        ]
      ],
      [
        "The Haitian Revolution, 1791–1804",
        [
          {
            "title": "OpenStax, World History Vol. 2, 7.3: Revolutions: America, France, and Haiti",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-3-revolutions-america-france-and-haiti",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 8.1: Revolution for Whom?",
            "url": "https://openstax.org/books/world-history-volume-2/pages/8-1-revolution-for-whom",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "SlaveVoyages",
            "url": "https://www.slavevoyages.org/",
            "note": "Free database of the Atlantic slave trade."
          }
        ]
      ],
      [
        "Spanish and Portuguese America win independence, 1808–1825",
        [
          {
            "title": "OpenStax, World History Vol. 2, 8.3: Spanish South America",
            "url": "https://openstax.org/books/world-history-volume-2/pages/8-3-spanish-south-america",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 8.4: Portuguese South America",
            "url": "https://openstax.org/books/world-history-volume-2/pages/8-4-portuguese-south-america",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 8.2: Spanish North America",
            "url": "https://openstax.org/books/world-history-volume-2/pages/8-2-spanish-north-america",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The Industrial Revolution in Britain, about 1760–1850",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.3: Capitalism and the First Industrial Revolution",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-3-capitalism-and-the-first-industrial-revolution",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Friedrich Engels, The Condition of the Working-Class in England in 1844",
            "url": "https://www.gutenberg.org/ebooks/17306",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "OpenStax, World History Vol. 2, 10.2: Life in the Industrial City",
            "url": "https://openstax.org/books/world-history-volume-2/pages/10-2-life-in-the-industrial-city",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Why Britain first? The Great Divergence debate",
        [
          {
            "title": "OpenStax, World History Vol. 2, 6.3: Capitalism and the First Industrial Revolution",
            "url": "https://openstax.org/books/world-history-volume-2/pages/6-3-capitalism-and-the-first-industrial-revolution",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Our World in Data: Economic Growth",
            "url": "https://ourworldindata.org/economic-growth",
            "note": "CC BY. Long-run GDP per head by country."
          },
          {
            "title": "Adam Smith, The Wealth of Nations (1776)",
            "url": "https://www.gutenberg.org/ebooks/3300",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Industry spreads: the second industrial revolution, 1850–1914",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.1: The Second Industrial Revolution",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-1-the-second-industrial-revolution",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 10.1: Inventions, Innovations, and Mechanization",
            "url": "https://openstax.org/books/world-history-volume-2/pages/10-1-inventions-innovations-and-mechanization",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 10.5: Regulation, Reform, and Revolutionary Ideologies",
            "url": "https://openstax.org/books/world-history-volume-2/pages/10-5-regulation-reform-and-revolutionary-ideologies",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Ending the slave trade and slavery, 1787–1888",
        [
          {
            "title": "The Interesting Narrative of the Life of Olaudah Equiano (1789)",
            "url": "https://www.gutenberg.org/ebooks/15399",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "SlaveVoyages",
            "url": "https://www.slavevoyages.org/",
            "note": "Free database of the Atlantic slave trade."
          },
          {
            "title": "Our World in Data: Slavery and forced labour",
            "url": "https://ourworldindata.org/slavery",
            "note": "CC BY. Long-run data."
          }
        ]
      ],
      [
        "Nationalism, liberalism and the revolutions of 1848",
        [
          {
            "title": "OpenStax, World History Vol. 2, 7.4: Nationalism, Liberalism, Conservatism, and the Political Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-4-nationalism-liberalism-conservatism-and-the-political-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Marx and Engels, The Communist Manifesto (1848), tr. Samuel Moore (1888)",
            "url": "https://www.gutenberg.org/ebooks/61",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "John Stuart Mill, On Liberty (1859)",
            "url": "https://www.gutenberg.org/ebooks/34901",
            "note": "Public domain, Project Gutenberg."
          }
        ]
      ],
      [
        "Italy and Germany are unified, 1859–1871",
        [
          {
            "title": "OpenStax, World History Vol. 2, 7.4: Nationalism, Liberalism, Conservatism, and the Political Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/7-4-nationalism-liberalism-conservatism-and-the-political-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Khan Academy, World History",
            "url": "https://www.khanacademy.org/humanities/world-history",
            "note": "Free overview videos."
          }
        ]
      ],
      [
        "The United States: westward expansion and the Civil War, 1803–1877",
        [
          {
            "title": "Narrative of the Life of Frederick Douglass (1845)",
            "url": "https://www.gutenberg.org/ebooks/23",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Mississippi's declaration of secession (1861), Avalon Project, Yale",
            "url": "https://avalon.law.yale.edu/19th_century/csa_missec.asp",
            "note": "Free primary source; quoted in the lesson."
          },
          {
            "title": "John Keegan, The American Civil War",
            "note": ". The military history."
          }
        ]
      ],
      [
        "Latin America after independence, 1825–1914",
        [
          {
            "title": "OpenStax, World History Vol. 2, 8.2: Spanish North America",
            "url": "https://openstax.org/books/world-history-volume-2/pages/8-2-spanish-north-america",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 8.3: Spanish South America",
            "url": "https://openstax.org/books/world-history-volume-2/pages/8-3-spanish-south-america",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Monroe Doctrine (1823), US National Archives",
            "url": "https://www.archives.gov/milestone-documents/monroe-doctrine",
            "note": "Free primary source."
          }
        ]
      ],
      [
        "Russia from the Crimean War to the 1905 revolution",
        [
          {
            "title": "OpenStax, World History Vol. 2, 10.5: Regulation, Reform, and Revolutionary Ideologies",
            "url": "https://openstax.org/books/world-history-volume-2/pages/10-5-regulation-reform-and-revolutionary-ideologies",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 11.1: Alliances, Expansion, and Conflict",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-1-alliances-expansion-and-conflict",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Karl Schlögel, The Soviet Century",
            "note": ". For where 1905 led."
          }
        ]
      ],
      [
        "The Ottoman reforms: from Mahmud II to the Young Turks",
        [
          {
            "title": "OpenStax, World History Vol. 2, 11.1: Alliances, Expansion, and Conflict",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-1-alliances-expansion-and-conflict",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 11.2: The Collapse of the Ottomans and the Coming of War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-2-the-collapse-of-the-ottomans-and-the-coming-of-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Andrew Wheatcroft, Infidels",
            "note": ". The Ottoman–European encounter."
          }
        ]
      ],
      [
        "The Opium Wars and the treaty ports, 1839–1860",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.2: Motives and Means of Imperialism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-2-motives-and-means-of-imperialism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Lin Zexu, letter to Queen Victoria (1839), Fordham Modern History Sourcebook",
            "url": "https://sourcebooks.fordham.edu/mod/1839lin2.asp",
            "note": "Free primary source."
          },
          {
            "title": "Treaty of Nanking (1842), Wikisource",
            "url": "https://en.wikisource.org/wiki/Treaty_of_Nanking",
            "note": "Free primary source."
          }
        ]
      ],
      [
        "The Taiping and the last decades of the Qing, 1850–1911",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.3: Colonial Empires",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-3-colonial-empires",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 9.4: Exploitation and Resistance",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-4-exploitation-and-resistance",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The Meiji Restoration: Japan remade, 1853–1912",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.3: Colonial Empires",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-3-colonial-empires",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Constitution of the Empire of Japan (1889), Wikisource",
            "url": "https://en.wikisource.org/wiki/Constitution_of_the_Empire_of_Japan",
            "note": "Free primary source."
          },
          {
            "title": "Andrew Gordon, A Modern History of Japan",
            "note": ". From the Tokugawa to the present."
          }
        ]
      ],
      [
        "India from Company rule to the Raj, 1757–1905",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.3: Colonial Empires",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-3-colonial-empires",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 9.4: Exploitation and Resistance",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-4-exploitation-and-resistance",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Fisher, History of India",
            "note": "as listed in the curriculum plan. For Company rule and 1857."
          }
        ]
      ],
      [
        "Africa before the Scramble: Sokoto, the Zulu kingdom and Ethiopia",
        [
          {
            "title": "South African History Online: the Mfecane",
            "url": "https://www.sahistory.org.za/topic/mfecane",
            "note": "Free. The debate and the period, in more depth."
          },
          {
            "title": "OpenStax, World History Vol. 2, 9.2: Motives and Means of Imperialism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-2-motives-and-means-of-imperialism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The Scramble for Africa and the Berlin Conference, 1884–1885",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.2: Motives and Means of Imperialism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-2-motives-and-means-of-imperialism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 9.3: Colonial Empires",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-3-colonial-empires",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Khan Academy, World History",
            "url": "https://www.khanacademy.org/humanities/world-history",
            "note": "Free overview videos."
          }
        ]
      ],
      [
        "African resistance: Isandlwana, Adwa and the wars of conquest",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.4: Exploitation and Resistance",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-4-exploitation-and-resistance",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "National Army Museum: the Zulu War",
            "url": "https://www.nam.ac.uk/explore/zulu-war",
            "note": "Free. Isandlwana and the 1879 campaign."
          },
          {
            "title": "South African History Online: the South African War 1899–1902",
            "url": "https://www.sahistory.org.za/article/south-african-war-1899-1902",
            "note": "Free. For the Boer war, briefly here."
          }
        ]
      ],
      [
        "The Congo Free State, 1885–1908",
        [
          {
            "title": "Arthur Conan Doyle, The Crime of the Congo (1909)",
            "url": "https://www.gutenberg.org/ebooks/37712",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Mark Twain, King Leopold's Soliloquy (1905)",
            "url": "https://www.gutenberg.org/ebooks/62739",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Joseph Conrad, Heart of Darkness (1899)",
            "url": "https://www.gutenberg.org/ebooks/219",
            "note": "Public domain, Project Gutenberg. The novel drawn from Conrad's 1890 Congo journey."
          }
        ]
      ],
      [
        "Southeast Asia, Australia and the Pacific under the new empires",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.3: Colonial Empires",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-3-colonial-empires",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Treaty of Waitangi (1840), Wikisource",
            "url": "https://en.wikisource.org/wiki/Treaty_of_Waitangi",
            "note": "Free primary source."
          },
          {
            "title": "OpenStax, World History Vol. 2, 9.4: Exploitation and Resistance",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-4-exploitation-and-resistance",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The new imperialism and its arguments",
        [
          {
            "title": "OpenStax, World History Vol. 2, 9.2: Motives and Means of Imperialism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-2-motives-and-means-of-imperialism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "J. A. Hobson, Imperialism: A Study (1902), Marxists Internet Archive",
            "url": "https://www.marxists.org/archive/hobson/1902/imperialism/",
            "note": "Free full text."
          },
          {
            "title": "V. I. Lenin, Imperialism, the Highest Stage of Capitalism, Marxists Internet Archive",
            "url": "https://www.marxists.org/archive/lenin/works/1916/imp-hsc/",
            "note": "Free full text."
          }
        ]
      ],
      [
        "Mass migration, 1815–1914",
        [
          {
            "title": "OpenStax, World History Vol. 2, 10.4: Communities in Diaspora",
            "url": "https://openstax.org/books/world-history-volume-2/pages/10-4-communities-in-diaspora",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 10.3: Coerced and Semicoerced Labor",
            "url": "https://openstax.org/books/world-history-volume-2/pages/10-3-coerced-and-semicoerced-labor",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Our World in Data: Migration",
            "url": "https://ourworldindata.org/migration",
            "note": "CC BY. Data on migration."
          }
        ]
      ],
      [
        "Darwin, germ theory and the science of the century",
        [
          {
            "title": "Charles Darwin, On the Origin of Species",
            "url": "https://www.gutenberg.org/ebooks/1228",
            "note": "Public domain, Project Gutenberg."
          },
          {
            "title": "Darwin Correspondence Project",
            "url": "https://www.darwinproject.ac.uk/",
            "note": "Free. Darwin's letters, Cambridge University."
          },
          {
            "title": "Our World in Data: Life Expectancy",
            "url": "https://ourworldindata.org/life-expectancy",
            "note": "CC BY. Long-run life expectancy."
          }
        ]
      ],
      [
        "Connections: the world in 1914",
        [
          {
            "title": "OpenStax, World History Vol. 2, 11.1: Alliances, Expansion, and Conflict",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-1-alliances-expansion-and-conflict",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 9.1: The Second Industrial Revolution",
            "url": "https://openstax.org/books/world-history-volume-2/pages/9-1-the-second-industrial-revolution",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Khan Academy, World History",
            "url": "https://www.khanacademy.org/humanities/world-history",
            "note": "Free overview videos."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 10 · The world wars, 1914–1945",
    "lessons": [
      [
        "Map: the world in the summer of 1914",
        [
          {
            "title": "OpenStax, World History Vol. 2, §11.1: Alliances, Expansion, and Conflict",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-1-alliances-expansion-and-conflict",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Our World in Data: world population over time",
            "url": "https://ourworldindata.org/grapher/world-population-1750-2015-and-un-projection-until-2100",
            "note": "CC BY. Population figures for the period."
          }
        ]
      ],
      [
        "The July Crisis of 1914 and the argument over who caused the war",
        [
          {
            "title": "OpenStax, World History Vol. 2, §11.1: Alliances, Expansion, and Conflict",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-1-alliances-expansion-and-conflict",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "1914–1918-online: International Encyclopedia of the First World War",
            "url": "https://encyclopedia.1914-1918-online.net/",
            "note": "Free, peer-reviewed; articles on the July Crisis and the war-guilt debate."
          },
          {
            "title": "Christopher Clark, The Sleepwalkers (2012); Fritz Fischer, Germany's Aims in the First World War (1961; English 1967)",
            "note": "The two poles of the debate, in print."
          }
        ]
      ],
      [
        "The Western Front, 1914–1917: the Marne, Verdun and the Somme",
        [
          {
            "title": "OpenStax, World History Vol. 2, §11.3: Total War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-3-total-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Wilfred Owen, Poems (1920)",
            "url": "https://www.gutenberg.org/ebooks/1034",
            "note": "Public domain, Project Gutenberg. A front-line officer's poems, published after his death in November 1918."
          },
          {
            "title": "Adam Hochschild, To End All Wars (2011)",
            "note": "Britain's war and its opponents."
          }
        ]
      ],
      [
        "The Eastern Front, Italy and the Balkans, 1914–1917",
        [
          {
            "title": "OpenStax, World History Vol. 2, §11.3: Total War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-3-total-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "1914–1918-online: International Encyclopedia of the First World War",
            "url": "https://encyclopedia.1914-1918-online.net/",
            "note": "Free; strong on the eastern, Balkan and Italian fronts."
          }
        ]
      ],
      [
        "The Ottoman war: Gallipoli, the Arab Revolt and the carving of the Middle East",
        [
          {
            "title": "OpenStax, World History Vol. 2, §11.2: The Collapse of the Ottomans and the Coming of War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-2-the-collapse-of-the-ottomans-and-the-coming-of-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Australian War Memorial: Gallipoli",
            "url": "https://www.awm.gov.au/articles/encyclopedia/gallipoli",
            "note": "Free; the campaign from the Australian side."
          },
          {
            "title": "Avalon Project (Yale): the Sykes–Picot Agreement and the Balfour Declaration",
            "url": "https://avalon.law.yale.edu/20th_century/sykes.asp",
            "note": "Full texts; the Balfour letter is at /20th_century/balfour.asp."
          }
        ]
      ],
      [
        "The war in Africa, Asia and the Pacific, 1914–1918",
        [
          {
            "title": "OpenStax, World History Vol. 2, §11.3: Total War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-3-total-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Imperialism",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook34.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "The Armenian genocide, 1915–1917",
        [
          {
            "title": "USHMM Holocaust Encyclopedia: The Armenian Genocide (1915–16), overview",
            "url": "https://encyclopedia.ushmm.org/content/en/article/the-armenian-genocide-1915-16-overview",
            "note": "Free; United States Holocaust Memorial Museum."
          },
          {
            "title": "Henry Morgenthau, Ambassador Morgenthau's Story (1918)",
            "url": "https://www.gutenberg.org/ebooks/55343",
            "note": "Public domain, Project Gutenberg. The US ambassador's account; a primary source with its own wartime purpose."
          },
          {
            "title": "Viscount Bryce and Arnold Toynbee (eds.), The Treatment of Armenians in the Ottoman Empire, 1915–16 (1916)",
            "url": "https://www.gutenberg.org/ebooks/69630",
            "note": "Public domain, Project Gutenberg. The British 'Blue Book' of testimony; published as wartime propaganda, but much of it since corroborated."
          }
        ]
      ],
      [
        "Russia's two revolutions of 1917 and the Civil War",
        [
          {
            "title": "OpenStax, World History Vol. 2, §12.2: The Formation of the Soviet Union",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-2-the-formation-of-the-soviet-union",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "John Reed, Ten Days That Shook the World (1919)",
            "url": "https://www.gutenberg.org/ebooks/3076",
            "note": "Public domain, Project Gutenberg. An American socialist's eyewitness account of October; openly partisan."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Russian Revolution",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook39.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "1917–1918: America enters, Germany gambles and the war ends",
        [
          {
            "title": "OpenStax, World History Vol. 2, §11.5: The War Ends",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-5-the-war-ends",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US National Archives: the Zimmermann Telegram",
            "url": "https://www.archives.gov/milestone-documents/zimmermann-telegram",
            "note": "Free; the decoded telegram with images."
          }
        ]
      ],
      [
        "The influenza pandemic of 1918–1920",
        [
          {
            "title": "CDC: 1918 Pandemic (H1N1 virus)",
            "url": "https://archive.cdc.gov/www_cdc_gov/flu/pandemic-resources/1918-pandemic-h1n1.html",
            "note": "Free; US Centers for Disease Control (archived page)."
          },
          {
            "title": "OpenStax, World History Vol. 2, §11.4: War on the Homefront",
            "url": "https://openstax.org/books/world-history-volume-2/pages/11-4-war-on-the-homefront",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Primary source: Wilson's Fourteen Points, January 1918",
        [
          {
            "title": "Internet Modern History Sourcebook (Fordham): Woodrow Wilson, Speech on the Fourteen Points",
            "url": "https://sourcebooks.fordham.edu/mod/1918wilson.asp",
            "note": "The text quoted in this lesson, from the Congressional Record, 65th Congress, 2nd Session."
          },
          {
            "title": "Wikisource: Fourteen Points Speech",
            "url": "https://en.wikisource.org/wiki/Fourteen_Points_Speech",
            "note": "The full speech, public domain; note its variant wording of point I."
          },
          {
            "title": "US National Archives: President Woodrow Wilson's 14 Points",
            "url": "https://www.archives.gov/milestone-documents/president-woodrow-wilsons-14-points",
            "note": "Free; images of the original reading copy."
          }
        ]
      ],
      [
        "The Paris peace of 1919 and the League of Nations",
        [
          {
            "title": "OpenStax, World History Vol. 2, §12.1: Recovering from World War I",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-1-recovering-from-world-war-i",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "John Maynard Keynes, The Economic Consequences of the Peace (1919)",
            "url": "https://www.gutenberg.org/ebooks/15776",
            "note": "Public domain, Project Gutenberg. The famous attack on the treaty."
          },
          {
            "title": "Avalon Project (Yale): the Versailles Treaty",
            "url": "https://avalon.law.yale.edu/subject_menus/versailles_menu.asp",
            "note": "Full text, part by part."
          }
        ]
      ],
      [
        "The end of the Ottomans and Atatürk's Turkey, 1918–1938",
        [
          {
            "title": "OpenStax, World History Vol. 2, §12.4: Old Empires and New Colonies",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-4-old-empires-and-new-colonies",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "T. E. Lawrence, Seven Pillars of Wisdom",
            "url": "https://www.gutenberg.org/ebooks/79877",
            "note": "Project Gutenberg. Lawrence's own account of the Arab Revolt and the end of Ottoman rule in Syria."
          }
        ]
      ],
      [
        "Empires under challenge between the wars: Gandhi, Ireland, Egypt and Pan-Africanism",
        [
          {
            "title": "OpenStax, World History Vol. 2, §12.5: Resistance, Civil Rights, and Democracy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-5-resistance-civil-rights-and-democracy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "M. K. Gandhi, Indian Home Rule (Hind Swaraj, 1909)",
            "url": "https://www.gutenberg.org/ebooks/40461",
            "note": "Project Gutenberg. Gandhi's own statement of his ideas before he led India's movement."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Decolonization",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook51.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "Stalin's revolution from above: collectivisation and the famine of 1932–33",
        [
          {
            "title": "OpenStax, World History Vol. 2, §12.2: The Formation of the Soviet Union",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-2-the-formation-of-the-soviet-union",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "R. W. Davies and Stephen Wheatcroft, The Years of Hunger (2004); Anne Applebaum, Red Famine (2017)",
            "note": "The two sides of the Holodomor debate, in print."
          },
          {
            "title": "Karl Schlögel, The Soviet Century (2023)",
            "note": "."
          }
        ]
      ],
      [
        "The Great Terror and the Gulag, 1934–1939",
        [
          {
            "title": "Anne Applebaum, Gulag: A History (2003)",
            "note": "the camp system from the archives and memoirs."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Russian Revolution",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook39.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "Mussolini and the invention of fascism, 1919–1936",
        [
          {
            "title": "Internet Modern History Sourcebook (Fordham): Fascism",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook42.asp",
            "note": "Free primary sources for this topic."
          },
          {
            "title": "OpenStax, World History Vol. 2, §12.1: Recovering from World War I",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-1-recovering-from-world-war-i",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Robert Paxton, The Anatomy of Fascism (2004)",
            "note": "The behaviour-based definition, in print."
          }
        ]
      ],
      [
        "The Great Depression across the world, 1929–1939",
        [
          {
            "title": "OpenStax, World History Vol. 2, §12.3: The Great Depression",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-3-the-great-depression",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: Protectionism in the Interwar Period",
            "url": "https://history.state.gov/milestones/1921-1936/great-depression",
            "note": "Free; tariffs and the Depression."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Depression",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook41.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "From Weimar to Hitler's dictatorship, 1918–1934",
        [
          {
            "title": "USHMM Holocaust Encyclopedia: The Nazi Rise to Power",
            "url": "https://encyclopedia.ushmm.org/content/en/article/the-nazi-rise-to-power",
            "note": "Free; elections and the seizure of power."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Nazism",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook43.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "China divided: the Republic, the Nationalists and the Communists, 1911–1937",
        [
          {
            "title": "OpenStax, World History Vol. 2, §12.4: Old Empires and New Colonies",
            "url": "https://openstax.org/books/world-history-volume-2/pages/12-4-old-empires-and-new-colonies",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Asia Since 1900",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook52.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "Japan's expansion and the Nanjing massacre, 1931–1938",
        [
          {
            "title": "US Office of the Historian: The Mukden Incident of 1931 and the Stimson Doctrine",
            "url": "https://history.state.gov/milestones/1921-1936/mukden-incident",
            "note": "Free."
          },
          {
            "title": "OpenStax, World History Vol. 2, §13.1: An Unstable Peace",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-1-an-unstable-peace",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Cambridge History of Japan, vol. 6 (The Twentieth Century); Andrew Gordon, A Modern History of Japan",
            "note": "."
          }
        ]
      ],
      [
        "The Spanish Civil War, 1936–1939",
        [
          {
            "title": "OpenStax, World History Vol. 2, §13.1: An Unstable Peace",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-1-an-unstable-peace",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Fascism",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook42.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "The road to war in Europe, 1935–1939, and the argument over appeasement",
        [
          {
            "title": "Avalon Project (Yale): the Munich Agreement",
            "url": "https://avalon.law.yale.edu/imt/munich1.asp",
            "note": "Full text."
          },
          {
            "title": "Avalon Project (Yale): the secret protocol of the Nazi–Soviet Pact",
            "url": "https://avalon.law.yale.edu/20th_century/addsepro.asp",
            "note": "Full text."
          },
          {
            "title": "Winston Churchill, The Gathering Storm (1948)",
            "note": "the anti-appeasement case by its chief participant."
          }
        ]
      ],
      [
        "Blitzkrieg and Barbarossa: the war in Europe, 1939–1941",
        [
          {
            "title": "OpenStax, World History Vol. 2, §13.2: Theaters of War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-2-theaters-of-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): World War II",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook45.asp",
            "note": "Free primary sources for this topic."
          },
          {
            "title": "US Office of the Historian: Lend-Lease and Military Aid to the Allies",
            "url": "https://history.state.gov/milestones/1937-1945/lend-lease",
            "note": "Free."
          }
        ]
      ],
      [
        "Stalingrad to Berlin: the defeat of Germany, 1942–1945",
        [
          {
            "title": "OpenStax, World History Vol. 2, §13.2: Theaters of War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-2-theaters-of-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Yalta Conference, 1945",
            "url": "https://history.state.gov/milestones/1937-1945/yalta-conf",
            "note": "Free."
          },
          {
            "title": "Richard Overy, Why the Allies Won (1995)",
            "note": "The production-and-strategy reading, in print."
          }
        ]
      ],
      [
        "The Holocaust, 1933–1945",
        [
          {
            "title": "USHMM Holocaust Encyclopedia: Introduction to the Holocaust",
            "url": "https://encyclopedia.ushmm.org/content/en/article/introduction-to-the-holocaust",
            "note": "Free; United States Holocaust Memorial Museum."
          },
          {
            "title": "USHMM Holocaust Encyclopedia: Wannsee Conference and the Final Solution",
            "url": "https://encyclopedia.ushmm.org/content/en/article/wannsee-conference-and-the-final-solution",
            "note": "Free."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham): Holocaust",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook44.asp",
            "note": "Free primary sources for this topic."
          }
        ]
      ],
      [
        "The Pacific War, 1941–1945",
        [
          {
            "title": "OpenStax, World History Vol. 2, §13.2: Theaters of War",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-2-theaters-of-war",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: Japan, China, the United States and the Road to Pearl Harbor",
            "url": "https://history.state.gov/milestones/1937-1945/pearl-harbor",
            "note": "Free."
          }
        ]
      ],
      [
        "Hiroshima, Nagasaki and the argument over the atomic bombs",
        [
          {
            "title": "Truman Library: The Decision to Drop the Atomic Bomb (documents)",
            "url": "https://www.trumanlibrary.gov/library/online-collections/decision-to-drop-atomic-bomb",
            "note": "Free; the primary documents both sides of the debate use."
          },
          {
            "title": "Wikisource: Potsdam Declaration",
            "url": "https://en.wikisource.org/wiki/Potsdam_Declaration",
            "note": "Full text, public domain."
          },
          {
            "title": "Hiroshima Peace Memorial Museum",
            "url": "https://hpmmuseum.jp/?lang=eng",
            "note": "Free; survivors' testimony and the museum's record of the bombing."
          }
        ]
      ],
      [
        "Home fronts and the colonies' war, 1939–1945",
        [
          {
            "title": "OpenStax, World History Vol. 2, §13.3: Keeping the Home Fires Burning",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-3-keeping-the-home-fires-burning",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US National Archives: Executive Order 9066",
            "url": "https://www.archives.gov/milestone-documents/executive-order-9066",
            "note": "Free; the order and its history."
          },
          {
            "title": "Avalon Project (Yale): the Atlantic Charter",
            "url": "https://avalon.law.yale.edu/wwii/atlantic.asp",
            "note": "Full text."
          }
        ]
      ],
      [
        "Connections: the world in 1945 and what it handed on",
        [
          {
            "title": "OpenStax, World History Vol. 2, §13.4: Out of the Ashes",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-4-out-of-the-ashes",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "United Nations Charter",
            "url": "https://www.un.org/en/about-us/un-charter",
            "note": "Full text, from the UN."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 11 · The Cold War and decolonisation, 1945–1991",
    "lessons": [
      [
        "Map: the world in 1945",
        [
          {
            "title": "OpenStax, World History Vol. 2, 13.4: Out of the Ashes",
            "url": "https://openstax.org/books/world-history-volume-2/pages/13-4-out-of-the-ashes",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "United Nations: Growth in UN membership",
            "url": "https://www.un.org/en/about-us/growth-in-un-membership",
            "note": "Year-by-year list of members, 1945 to now: decolonisation in one table."
          }
        ]
      ],
      [
        "The United Nations and the post-war order",
        [
          {
            "title": "Charter of the United Nations",
            "url": "https://www.un.org/en/about-us/un-charter",
            "note": "Full text, free."
          },
          {
            "title": "Universal Declaration of Human Rights",
            "url": "https://www.un.org/en/about-us/universal-declaration-of-human-rights",
            "note": "Full text, free."
          },
          {
            "title": "US Office of the Historian: The Nuremberg Trials",
            "url": "https://history.state.gov/milestones/1945-1952/nuremberg",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "The Iron Curtain falls, 1945–1949",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.1: The Cold War Begins",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-1-the-cold-war-begins",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Marshall Plan",
            "url": "https://history.state.gov/milestones/1945-1952/marshall-plan",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: The Berlin Airlift",
            "url": "https://history.state.gov/milestones/1945-1952/berlin-airlift",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Who started the Cold War? Three schools and the archives",
        [
          {
            "title": "Wilson Center: Cold War International History Project",
            "url": "https://www.wilsoncenter.org/program/cold-war-international-history-project",
            "note": "Translated documents from Soviet, East European and Chinese archives, free."
          },
          {
            "title": "US Office of the Historian: Kennan and Containment",
            "url": "https://history.state.gov/milestones/1945-1952/kennan",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "John Lewis Gaddis, We Now Know: Rethinking Cold War History (1997)",
            "note": "Printed book; the post-archive case for Stalin's responsibility."
          }
        ]
      ],
      [
        "The partition of India, 1947",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.4: Global Tensions and Decolonization",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-4-global-tensions-and-decolonization",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "The 1947 Partition Archive",
            "url": "https://www.1947partitionarchive.org/",
            "note": "Oral histories of survivors, free."
          },
          {
            "title": "Ayesha Jalal, The Sole Spokesman (1985)",
            "note": "Printed book; Jinnah and the Pakistan demand."
          }
        ]
      ],
      [
        "Israel and Palestine, 1947–1949: two narratives",
        [
          {
            "title": "UN General Assembly Resolution 181 (Avalon Project, Yale)",
            "url": "https://avalon.law.yale.edu/20th_century/res181.asp",
            "note": "The partition plan, full text."
          },
          {
            "title": "Declaration of the Establishment of the State of Israel (Avalon Project, Yale)",
            "url": "https://avalon.law.yale.edu/20th_century/israel.asp",
            "note": "14 May 1948, full text."
          },
          {
            "title": "Benny Morris, The Birth of the Palestinian Refugee Problem Revisited (2004)",
            "note": "Printed book; read alongside Walid Khalidi's and Rashid Khalidi's work for the Palestinian account."
          }
        ]
      ],
      [
        "The Chinese Revolution, 1949",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.2: The Spread of Communism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-2-the-spread-of-communism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Chinese Revolution of 1949",
            "url": "https://history.state.gov/milestones/1945-1952/chinese-rev",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Mao's China: the Great Leap Forward and the Cultural Revolution",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.2: The Spread of Communism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-2-the-spread-of-communism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Our World in Data: Famines",
            "url": "https://ourworldindata.org/famines",
            "note": "Free data on famine mortality, with the Chinese estimates and their ranges."
          },
          {
            "title": "Yang Jisheng, Tombstone: The Great Chinese Famine (English tr. 2012)",
            "note": "Printed book; a Chinese journalist's archival account."
          }
        ]
      ],
      [
        "The Korean War, 1950–1953",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.2: The Spread of Communism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-2-the-spread-of-communism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Korean War, 1950–1953",
            "url": "https://history.state.gov/milestones/1945-1952/korean-war",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Decolonisation in Asia: Indonesia, Indochina and Malaya",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.4: Global Tensions and Decolonization",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-4-global-tensions-and-decolonization",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: Decolonization of Asia and Africa, 1945–1960",
            "url": "https://history.state.gov/milestones/1945-1952/asia-and-africa",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: Dien Bien Phu and the Fall of French Indochina",
            "url": "https://history.state.gov/milestones/1953-1960/dien-bien-phu",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Ghana and the year of Africa, 1957–1960",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.4: Global Tensions and Decolonization",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-4-global-tensions-and-decolonization",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Internet African History Sourcebook (Fordham)",
            "url": "https://sourcebooks.fordham.edu/africa/africasbook.asp",
            "note": "Free primary sources, including decolonisation."
          },
          {
            "title": "Kwame Nkrumah archive (Marxists Internet Archive)",
            "url": "https://www.marxists.org/subject/africa/nkrumah/index.htm",
            "note": "Free texts of Nkrumah's writings and speeches."
          }
        ]
      ],
      [
        "Algeria and Kenya: the wars of settler colonies",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.4: Global Tensions and Decolonization",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-4-global-tensions-and-decolonization",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "David Anderson, Histories of the Hanged (2005)",
            "note": "Printed book; read with Caroline Elkins, Imperial Reckoning (2005)."
          }
        ]
      ],
      [
        "The Congo crisis, 1960–1965",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.4: Global Tensions and Decolonization",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-4-global-tensions-and-decolonization",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Congo, Decolonization, and the Cold War, 1960–1965",
            "url": "https://history.state.gov/milestones/1961-1968/congo-decolonization",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Bandung, Suez and the Non-Aligned Movement",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.3: The Non-Aligned Movement",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-3-the-non-aligned-movement",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Bandung Conference, 1955",
            "url": "https://history.state.gov/milestones/1953-1960/bandung-conf",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: The Suez Crisis, 1956",
            "url": "https://history.state.gov/milestones/1953-1960/suez",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Primary source: Kennedy's inaugural address, 1961",
        [
          {
            "title": "Inaugural Address of John F. Kennedy (Avalon Project, Yale)",
            "url": "https://avalon.law.yale.edu/20th_century/kennedy.asp",
            "note": "Full text of the speech quoted; public domain as a US government work."
          },
          {
            "title": "Truman Doctrine, 12 March 1947 (Avalon Project, Yale)",
            "url": "https://avalon.law.yale.edu/20th_century/trudoc.asp",
            "note": "The earlier statement of containment, for comparison."
          },
          {
            "title": "Internet Modern History Sourcebook (Fordham)",
            "url": "https://sourcebooks.fordham.edu/mod/modsbook.asp",
            "note": "Free primary sources; see the sections on the Cold War, decolonisation and the post-war world."
          }
        ]
      ],
      [
        "Cuba, Berlin and the missile crisis, 1959–1962",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.2: The Spread of Communism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-2-the-spread-of-communism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Cuban Missile Crisis, October 1962",
            "url": "https://history.state.gov/milestones/1961-1968/cuban-missile-crisis",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: The Bay of Pigs Invasion and its Aftermath",
            "url": "https://history.state.gov/milestones/1961-1968/bay-of-pigs",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "The space race, 1957–1975",
        [
          {
            "title": "US Office of the Historian: Sputnik, 1957",
            "url": "https://history.state.gov/milestones/1953-1960/sputnik",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "Kennedy, Special Message to the Congress on Urgent National Needs, 25 May 1961 (American Presidency Project)",
            "url": "https://www.presidency.ucsb.edu/documents/special-message-the-congress-urgent-national-needs",
            "note": "The Moon-landing goal, full text."
          },
          {
            "title": "NASA: Apollo 11",
            "url": "https://www.nasa.gov/mission/apollo-11/",
            "note": "Mission history, images and transcripts."
          }
        ]
      ],
      [
        "The Vietnam War, 1955–1975",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.2: The Spread of Communism",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-2-the-spread-of-communism",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Gulf of Tonkin Incident, 1964",
            "url": "https://history.state.gov/milestones/1961-1968/gulf-of-tonkin",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: Ending the Vietnam War, 1969–1973",
            "url": "https://history.state.gov/milestones/1969-1976/ending-vietnam",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "The civil rights movement in the United States, 1954–1968",
        [
          {
            "title": "National Archives: Brown v. Board of Education (1954)",
            "url": "https://www.archives.gov/milestone-documents/brown-v-board-of-education",
            "note": "The ruling, with context."
          },
          {
            "title": "National Archives: Civil Rights Act (1964)",
            "url": "https://www.archives.gov/milestone-documents/civil-rights-act",
            "note": "The Act, with context."
          },
          {
            "title": "National Archives: Voting Rights Act (1965)",
            "url": "https://www.archives.gov/milestone-documents/voting-rights-act",
            "note": "The Act, with context."
          }
        ]
      ],
      [
        "Apartheid South Africa, 1948–1990, in brief",
        [
          {
            "title": "South African History Online: A history of apartheid in South Africa",
            "url": "https://www.sahistory.org.za/article/history-apartheid-south-africa",
            "note": "Free overview; the depth is in the South African Politics curriculum."
          },
          {
            "title": "South African History Online: The Freedom Charter",
            "url": "https://www.sahistory.org.za/article/freedom-charter",
            "note": "Full text, 1955."
          },
          {
            "title": "OpenStax, World History Vol. 2, 14.4: Global Tensions and Decolonization",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-4-global-tensions-and-decolonization",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "The Arab–Israeli wars and the oil shocks, 1967–1979",
        [
          {
            "title": "US Office of the Historian: The 1967 Arab-Israeli War",
            "url": "https://history.state.gov/milestones/1961-1968/arab-israeli-war-1967",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: Oil Embargo, 1973–1974",
            "url": "https://history.state.gov/milestones/1969-1976/oil-embargo",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: The Camp David Accords and the Arab-Israeli Peace Process",
            "url": "https://history.state.gov/milestones/1977-1980/camp-david",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "The Iranian revolution, 1979",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.5: A New World Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-5-a-new-world-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Charles Kurzman, The Unthinkable Revolution in Iran (2004)",
            "note": "Printed book; why no one predicted it."
          },
          {
            "title": "Ervand Abrahamian, A History of Modern Iran (2008)",
            "note": "Printed book; the 1953 coup to the Islamic Republic."
          }
        ]
      ],
      [
        "The Soviet–Afghan war, 1979–1989",
        [
          {
            "title": "US Office of the Historian: The Soviet Invasion of Afghanistan and the U.S. Response, 1978–1980",
            "url": "https://history.state.gov/milestones/1977-1980/soviet-invasion-afghanistan",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "Wilson Center Digital Archive",
            "url": "https://www.wilsoncenter.org/digital-archive",
            "note": "Free translated Soviet documents, including the Politburo's Afghanistan decisions."
          }
        ]
      ],
      [
        "Latin America's dictatorships, 1954–1990",
        [
          {
            "title": "US Office of the Historian: Allende and Chile, 1970–1973",
            "url": "https://history.state.gov/milestones/1969-1976/allende",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: Central America, 1981–1993",
            "url": "https://history.state.gov/milestones/1981-1988/central-america",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: Alliance for Progress and Peace Corps, 1961–1969",
            "url": "https://history.state.gov/milestones/1961-1968/alliance-for-progress",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Deng Xiaoping's reforms and Tiananmen, 1976–1989",
        [
          {
            "title": "OpenStax, World History Vol. 2, 15.1: A Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-1-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: China Policy",
            "url": "https://history.state.gov/milestones/1977-1980/china-policy",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "US Office of the Historian: The Tiananmen Square Incident",
            "url": "https://history.state.gov/milestones/1989-1992/tiananmen-square",
            "note": "Free short history from the US State Department's historians; an American government view."
          }
        ]
      ],
      [
        "Japan's miracle and the Asian tigers",
        [
          {
            "title": "OpenStax, World History Vol. 2, 15.1: A Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-1-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: Occupation and Reconstruction of Japan, 1945–52",
            "url": "https://history.state.gov/milestones/1945-1952/japan-reconstruction",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "Our World in Data: Economic Growth",
            "url": "https://ourworldindata.org/economic-growth",
            "note": "Free GDP-per-head data: compare South Korea, Taiwan and others since 1950."
          }
        ]
      ],
      [
        "The European Community, 1950–1992",
        [
          {
            "title": "European Union: The Schuman Declaration, 9 May 1950",
            "url": "https://european-union.europa.eu/principles-countries-history/history-eu/1945-59/schuman-declaration-may-1950_en",
            "note": "Full text and context."
          },
          {
            "title": "European Union: History of the EU",
            "url": "https://european-union.europa.eu/principles-countries-history/history-eu_en",
            "note": "Official timeline, by decade; an EU view."
          },
          {
            "title": "OpenStax, World History Vol. 2, 15.1: A Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-1-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          }
        ]
      ],
      [
        "Gorbachev and the revolutions of 1989",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.5: A New World Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-5-a-new-world-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Collapse of Communism in Eastern Europe",
            "url": "https://history.state.gov/milestones/1989-1992/fall-of-communism",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "Berlin Wall Foundation",
            "url": "https://www.stiftung-berliner-mauer.de/en",
            "note": "The Wall's history and memorial sites."
          }
        ]
      ],
      [
        "The end of the Soviet Union, 1991",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.5: A New World Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-5-a-new-world-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "US Office of the Historian: The Collapse of the Soviet Union",
            "url": "https://history.state.gov/milestones/1989-1992/collapse-soviet-union",
            "note": "Free short history from the US State Department's historians; an American government view."
          },
          {
            "title": "Bush, Remarks to the Supreme Soviet of the Ukraine, 1 August 1991 (American Presidency Project)",
            "url": "https://www.presidency.ucsb.edu/documents/remarks-the-supreme-soviet-the-republic-the-ukraine-kiev-soviet-union",
            "note": "The 'Chicken Kiev' speech, full text."
          }
        ]
      ],
      [
        "Connections: the world at the end of the Cold War",
        [
          {
            "title": "OpenStax, World History Vol. 2, 14.5: A New World Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-5-a-new-world-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "OpenStax, World History Vol. 2, 15.1: A Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-1-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "Our World in Data: Economic Growth",
            "url": "https://ourworldindata.org/economic-growth",
            "note": "Free data on the world economy, 1945–1991 and after."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 12 · The world now, 1991–",
    "lessons": [
      [
        "Map: the world in 1991",
        [
          {
            "title": "OpenStax, World History Vol. 2, section 14.5: A New World Order",
            "url": "https://openstax.org/books/world-history-volume-2/pages/14-5-a-new-world-order",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "United Nations: Growth in UN membership",
            "url": "https://www.un.org/en/about-us/growth-in-un-membership",
            "note": "The new states of 1991–93, year by year."
          }
        ]
      ],
      [
        "The end of history? Fukuyama and Huntington",
        [
          {
            "title": "Francis Fukuyama, The End of History and the Last Man (1992)",
            "note": "Printed book; the full argument, including the often-skipped 'last man' half."
          },
          {
            "title": "Samuel P. Huntington, The Clash of Civilizations and the Remaking of World Order (1996)",
            "note": "Printed book; expands the 1993 Foreign Affairs essay."
          },
          {
            "title": "Our World in Data: Democracy",
            "url": "https://ourworldindata.org/democracy",
            "note": "Free charts of V-Dem and other democracy measures since 1800: the evidence for both sides."
          }
        ]
      ],
      [
        "Globalisation and the World Trade Organization",
        [
          {
            "title": "OpenStax, World History Vol. 2, section 15.1: A Global Economy",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-1-a-global-economy",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "WTO: What is the WTO?",
            "url": "https://www.wto.org/english/thewto_e/whatis_e/whatis_e.htm",
            "note": "The organisation's own account of its history and rules."
          },
          {
            "title": "Our World in Data: Extreme poverty",
            "url": "https://ourworldindata.org/extreme-poverty",
            "note": "World Bank poverty data since 1990, charted."
          }
        ]
      ],
      [
        "The European Union and the euro",
        [
          {
            "title": "European Union: History of the EU",
            "url": "https://european-union.europa.eu/principles-countries-history/history-eu_en",
            "note": "Official timeline, decade by decade."
          },
          {
            "title": "European Central Bank: Introduction to the euro",
            "url": "https://www.ecb.europa.eu/euro/intro/html/index.en.html",
            "note": "The single currency's history and members."
          },
          {
            "title": "Mario Draghi, speech in London, 26 July 2012",
            "url": "https://www.ecb.europa.eu/press/key/date/2012/html/sp120726.en.html",
            "note": "The 'whatever it takes' speech, on the ECB site."
          }
        ]
      ],
      [
        "The wars of Yugoslavia, 1991–2001",
        [
          {
            "title": "ICTY: Key figures of the cases",
            "url": "https://www.icty.org/en/cases/key-figures-cases",
            "note": "The tribunal's record of 161 indicted and their outcomes."
          },
          {
            "title": "US Holocaust Memorial Museum: Bosnia and Herzegovina",
            "url": "https://www.ushmm.org/genocide-prevention/countries/bosnia-herzegovina",
            "note": "The Bosnian war and Srebrenica."
          },
          {
            "title": "International Court of Justice: Bosnia and Herzegovina v. Serbia and Montenegro (genocide case)",
            "url": "https://www.icj-cij.org/case/91",
            "note": "The 2007 judgment that Srebrenica was genocide."
          }
        ]
      ],
      [
        "Rwanda, 1994: the genocide against the Tutsi",
        [
          {
            "title": "Human Rights Watch (Alison Des Forges), Leave None to Tell the Story (1999)",
            "url": "https://www.hrw.org/reports/1999/rwanda/",
            "note": "The standard documented history of the genocide, free online."
          },
          {
            "title": "United Nations: Outreach programme on the 1994 genocide against the Tutsi in Rwanda",
            "url": "https://www.un.org/en/preventgenocide/rwanda",
            "note": "Background, timeline and the UN's own failure."
          },
          {
            "title": "US Holocaust Memorial Museum: Rwanda",
            "url": "https://www.ushmm.org/genocide-prevention/countries/rwanda",
            "note": "History of the genocide and its aftermath."
          }
        ]
      ],
      [
        "South Africa's 1994 election and Africa's new century",
        [
          {
            "title": "South African History Online",
            "url": "https://www.sahistory.org.za/",
            "note": "Free encyclopaedia of South African history; the transition in depth. See also the South African Politics curriculum."
          },
          {
            "title": "Truth and Reconciliation Commission (Department of Justice)",
            "url": "https://www.justice.gov.za/trc/",
            "note": "The TRC's reports and hearings, official site."
          },
          {
            "title": "Nobel Peace Prize 1993: Mandela and de Klerk",
            "url": "https://www.nobelprize.org/prizes/peace/1993/summary/",
            "note": "Prize page with lectures."
          }
        ]
      ],
      [
        "The internet and the digital revolution",
        [
          {
            "title": "OpenStax, World History Vol. 2, section 15.3: Science and Technology for Today's World",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-3-science-and-technology-for-todays-world",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "CERN: info.cern.ch, the first website",
            "url": "https://info.cern.ch/",
            "note": "The restored first web page and its history."
          },
          {
            "title": "ITU: Facts and Figures 2024",
            "url": "https://www.itu.int/itu-d/reports/statistics/facts-figures-2024/",
            "note": "Who is online, by region and income."
          }
        ]
      ],
      [
        "9/11 and the war in Afghanistan",
        [
          {
            "title": "The 9/11 Commission Report (2004)",
            "url": "https://www.9-11commission.gov/report/",
            "note": "US government report, public domain; free in full."
          },
          {
            "title": "Costs of War project, Brown University",
            "url": "https://watson.brown.edu/costsofwar/",
            "note": "Estimates of deaths and costs of the post-9/11 wars, with methods."
          },
          {
            "title": "Council on Foreign Relations: The U.S. War in Afghanistan, timeline",
            "url": "https://www.cfr.org/timeline/us-war-afghanistan",
            "note": "1999–2021, step by step."
          }
        ]
      ],
      [
        "The Iraq War, 2003–2011",
        [
          {
            "title": "Comprehensive Report of the Special Advisor to the DCI on Iraq's WMD (Duelfer Report, 2004)",
            "url": "https://www.govinfo.gov/app/details/GPO-DUELFERREPORT",
            "note": "US government text, public domain: the finding of no active WMD programmes."
          },
          {
            "title": "The Report of the Iraq Inquiry (Chilcot, 2016)",
            "url": "https://www.gov.uk/government/publications/the-report-of-the-iraq-inquiry",
            "note": "The UK's official inquiry; the executive summary is the place to start."
          },
          {
            "title": "Iraq Body Count",
            "url": "https://www.iraqbodycount.org/",
            "note": "Documented civilian deaths, with its counting method explained."
          }
        ]
      ],
      [
        "The rise of China",
        [
          {
            "title": "World Bank: China overview",
            "url": "https://www.worldbank.org/en/country/china/overview",
            "note": "Growth and poverty figures."
          },
          {
            "title": "WTO: China and the WTO",
            "url": "https://www.wto.org/english/thewto_e/countries_e/china_e.htm",
            "note": "Accession in 2001 and China's trade record."
          },
          {
            "title": "Council on Foreign Relations: China's repression of Uyghurs in Xinjiang",
            "url": "https://www.cfr.org/backgrounder/china-xinjiang-uyghurs-muslims-repression-genocide-human-rights",
            "note": "The evidence and the competing claims."
          }
        ]
      ],
      [
        "India's growth since 1991",
        [
          {
            "title": "Manmohan Singh, Budget speech, 24 July 1991",
            "url": "https://www.indiabudget.gov.in/doc/bspeech/bs199192.pdf",
            "note": "The reform budget itself, on the Government of India's budget site (PDF)."
          },
          {
            "title": "World Bank: India overview",
            "url": "https://www.worldbank.org/en/country/india/overview",
            "note": "Growth, poverty and jobs."
          }
        ]
      ],
      [
        "The 2008 financial crisis",
        [
          {
            "title": "Federal Reserve History: The Great Recession and its aftermath",
            "url": "https://www.federalreservehistory.org/essays/great-recession-of-200709",
            "note": "Clear account by the US central bank's historians."
          },
          {
            "title": "The Financial Crisis Inquiry Report (2011)",
            "url": "https://www.govinfo.gov/app/details/GPO-FCIC",
            "note": "US government report, public domain, with the dissents."
          }
        ]
      ],
      [
        "The Arab Spring and the war in Syria",
        [
          {
            "title": "Council on Foreign Relations: The Arab Spring",
            "url": "https://www.cfr.org/timeline/arab-spring",
            "note": "Timeline of the uprisings and their aftermath."
          },
          {
            "title": "Marc Lynch, The New Arab Wars (2016)",
            "note": "Printed book by a leading American scholar of Arab politics; why the uprisings turned to war."
          }
        ]
      ],
      [
        "Russia under Putin",
        [
          {
            "title": "Council on Foreign Relations: Ukraine, conflict at the crossroads of Europe and Russia",
            "url": "https://www.cfr.org/backgrounder/ukraine-conflict-crossroads-europe-and-russia",
            "note": "Russia's relations with NATO and Ukraine since 1991."
          },
          {
            "title": "NATO: Enlargement and Article 10",
            "url": "https://www.nato.int/cps/en/natohq/topics_49212.htm",
            "note": "The alliance's own account of who joined when."
          },
          {
            "title": "Catherine Belton, Putin's People (2020)",
            "note": "Printed book by a former Moscow correspondent on the KGB men around Putin; some claims contested in court and by its subjects."
          }
        ]
      ],
      [
        "Ukraine: 2014 and the 2022 invasion",
        [
          {
            "title": "Vladimir Putin, 'On the Historical Unity of Russians and Ukrainians' (July 2021)",
            "url": "http://en.kremlin.ru/events/president/news/66181",
            "note": "Primary source, on the Kremlin's site: Putin's case in his own words. Read it as a claim."
          },
          {
            "title": "Council on Foreign Relations: Global Conflict Tracker, war in Ukraine",
            "url": "https://www.cfr.org/global-conflict-tracker/conflict/conflict-ukraine",
            "note": "Kept up to date; check it against the 'as of' stamp."
          },
          {
            "title": "International Criminal Court: Situation in Ukraine",
            "url": "https://www.icc-cpi.int/situations/ukraine",
            "note": "The investigation and the warrants of 2023."
          }
        ]
      ],
      [
        "Latin America since 1991: markets, the pink tide and after",
        [
          {
            "title": "Council on Foreign Relations: Venezuela, the rise and fall of a petrostate",
            "url": "https://www.cfr.org/backgrounder/venezuela-crisis",
            "note": "Chávez, Maduro and the collapse."
          },
          {
            "title": "PBS NewsHour (AP): US strikes Venezuela and says Maduro has been captured",
            "url": "https://www.pbs.org/newshour/world/us-strikes-venezuela-and-says-its-leader-maduro-has-been-captured-and-flown-out-of-the-country",
            "note": "Wire report of 3 January 2026: a first draft, to be read as one."
          },
          {
            "title": "Nobel Peace Prize 2016: Juan Manuel Santos",
            "url": "https://www.nobelprize.org/prizes/peace/2016/santos/facts/",
            "note": "Colombia's peace with the FARC."
          }
        ]
      ],
      [
        "Climate change as history",
        [
          {
            "title": "OpenStax, World History Vol. 2, section 15.2: Debates about the Environment",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-2-debates-about-the-environment",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "NOAA Global Monitoring Laboratory: Trends in atmospheric CO2",
            "url": "https://gml.noaa.gov/ccgg/trends/",
            "note": "The Mauna Loa record since 1958."
          },
          {
            "title": "WMO confirms 2024 as warmest year on record",
            "url": "https://wmo.int/news/media-centre/wmo-confirms-2024-warmest-year-record-about-155degc-above-pre-industrial-level",
            "note": "The UN weather agency's statement, with what a single year above 1.5 °C does and does not mean."
          }
        ]
      ],
      [
        "COVID-19",
        [
          {
            "title": "WHO: 14.9 million excess deaths associated with COVID-19 in 2020 and 2021",
            "url": "https://www.who.int/news/item/05-05-2022-14.9-million-excess-deaths-were-associated-with-the-covid-19-pandemic-in-2020-and-2021",
            "note": "The excess-mortality estimate and its range."
          },
          {
            "title": "Our World in Data: Excess mortality during COVID-19",
            "url": "https://ourworldindata.org/excess-mortality-covid",
            "note": "Country by country, with the method explained."
          }
        ]
      ],
      [
        "Populism: the people against the elite",
        [
          {
            "title": "Cas Mudde and Cristóbal Rovira Kaltwasser, Populism: A Very Short Introduction (2017)",
            "note": "Printed book; the standard definition, with examples from every continent."
          },
          {
            "title": "Pippa Norris and Ronald Inglehart, Cultural Backlash (2019)",
            "note": "Printed book; the case for the cultural explanation."
          },
          {
            "title": "V-Dem Institute",
            "url": "https://www.v-dem.net/",
            "note": "Free annual democracy reports; the data behind claims of democratic retreat."
          }
        ]
      ],
      [
        "Primary source: the Charter of the United Nations, preamble",
        [
          {
            "title": "Charter of the United Nations: Preamble",
            "url": "https://www.un.org/en/about-us/un-charter/preamble",
            "note": "The official English text quoted in the lesson."
          },
          {
            "title": "Charter of the United Nations: Chapter I (Articles 1–2)",
            "url": "https://www.un.org/en/about-us/un-charter/chapter-1",
            "note": "Article 2(4), quoted in the lesson."
          },
          {
            "title": "United Nations: The San Francisco Conference, 1945",
            "url": "https://www.un.org/en/about-us/history-of-the-un/san-francisco-conference",
            "note": "How the Charter was written."
          }
        ]
      ],
      [
        "How to read the news as history",
        [
          {
            "title": "Civic Online Reasoning (Digital Inquiry Group, formerly Stanford History Education Group)",
            "url": "https://cor.inquirygroup.org/",
            "note": "Free lessons on checking online sources the way fact-checkers do."
          },
          {
            "title": "Dutch Safety Board: Crash of MH17",
            "url": "https://www.onderzoeksraad.nl/en/page/3546/crash-mh17-17-july-2014",
            "note": "A worked example of an investigation settling a disputed news story."
          }
        ]
      ],
      [
        "Connections: the world as of November 2026",
        [
          {
            "title": "OpenStax, World History Vol. 2, section 15.4: Ongoing Problems and Solutions",
            "url": "https://openstax.org/books/world-history-volume-2/pages/15-4-ongoing-problems-and-solutions",
            "note": "Free to read. CC BY-NC-SA 4.0 — further reading, not adapted."
          },
          {
            "title": "International Court of Justice: South Africa v. Israel (Genocide Convention, Gaza)",
            "url": "https://www.icj-cij.org/case/192",
            "note": "Brought by South Africa in December 2023; the filings of both sides and the orders so far."
          },
          {
            "title": "Our World in Data: CO2 emissions",
            "url": "https://ourworldindata.org/co2-emissions",
            "note": "Who emitted, when: the long view behind the climate questions."
          }
        ]
      ]
    ]
  }
];

const out = [
  '-- Generated by scripts/curriculums/history.mjs. Read before running.',
  '-- Apply it with `npm run curriculum history`, which carries ticks,',
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
for (const key of strayDetail) console.error(`! history-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! history-cards.json has no lesson: ${key}`);

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
