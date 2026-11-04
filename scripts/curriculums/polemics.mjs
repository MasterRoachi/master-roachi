// Polemics — answering from the Orthodox faith. The plan and every ruling
// are in scripts/curriculums/polemics.md; this file is the structure. The
// material is in polemics-detail.json and the cards in polemics-cards.json,
// keyed by lesson name.
//
//   npm run curriculum polemics       # the live database
//
// THE RULE FOR THIS ONE: their case at its strongest, from their own texts;
// then the Orthodox answer; then their reply; then what it finally rests on.
// Where Orthodox writers answer differently, each view in its strongest form.
// Quotations come only from public-domain or freely licensed translations
// fetched and checked word for word; anything in copyright is paraphrased.

import detail from './polemics-detail.json' with { type: 'json' };
import cards from './polemics-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/polemics.md';
const NAME = 'Polemics';

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
    "name": "Stage 1 · How the Church answers",
    "lessons": [
      [
        "Context: what polemics is and why the Church answers",
        [
          {
            "title": "St Irenaeus, Against Heresies, Book I Preface, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103100.htm",
            "note": "Public domain, New Advent. Why the Fathers answered error: so that the sheep are not carried off."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book. Metropolitan Kallistos Ware's standard introduction, including the Church's relations with other Christians."
          }
        ]
      ],
      [
        "Apologia and polemic: giving an answer for the hope that is in you",
        [
          {
            "title": "1 Peter 3 (King James Version)",
            "url": "https://ebible.org/eng-kjv/1PE03.htm",
            "note": "Public domain. Verses 15–16: the apologia."
          },
          {
            "title": "St Justin Martyr, First Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Public domain. The first great Christian apology addressed to an emperor."
          }
        ]
      ],
      [
        "Heresy, schism and heterodoxy: the words defined",
        [
          {
            "title": "St Basil the Great, Letter 188 (First Canonical Letter to Amphilochius), tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/3202188.htm",
            "note": "Public domain. Canon 1: heresies, schisms and unlawful congregations."
          },
          {
            "title": "Titus 3 (King James Version)",
            "url": "https://ebible.org/eng-kjv/TIT03.htm",
            "note": "Public domain. Verse 10 on the heretic."
          }
        ]
      ],
      [
        "\"There must be also heresies\": why errors arise and what they test",
        [
          {
            "title": "1 Corinthians 11 (King James Version)",
            "url": "https://ebible.org/eng-kjv/1CO11.htm",
            "note": "Public domain. Verse 19."
          },
          {
            "title": "St Irenaeus, Against Heresies I.10, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103110.htm",
            "note": "Public domain. The rule of faith held by the Church everywhere."
          }
        ]
      ],
      [
        "Speaking the truth in love: why truth and charity are not rivals",
        [
          {
            "title": "Ephesians 4 (King James Version)",
            "url": "https://ebible.org/eng-kjv/EPH04.htm",
            "note": "Public domain. Verse 15."
          },
          {
            "title": "St Justin Martyr, Dialogue with Trypho, chapters 125–142, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/01289.htm",
            "note": "Public domain. Chapter 142: Justin and Trypho part as friends, Justin praying for them."
          }
        ]
      ],
      [
        "Reading: St Paul at the Areopagus (Acts 17:22–31)",
        [
          {
            "title": "Acts 17 (King James Version)",
            "url": "https://ebible.org/eng-kjv/ACT17.htm",
            "note": "Public domain. The text read in this lesson."
          }
        ]
      ],
      [
        "The Areopagus method: common ground without compromise",
        [
          {
            "title": "Acts 17 (King James Version)",
            "url": "https://ebible.org/eng-kjv/ACT17.htm",
            "note": "Public domain. The speech from which the method is drawn."
          },
          {
            "title": "St Justin Martyr, Second Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0127.htm",
            "note": "Public domain. Chapter 13: the seeds of the Word."
          }
        ]
      ],
      [
        "St Justin Martyr: the seeds of the Word",
        [
          {
            "title": "St Justin Martyr, Second Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0127.htm",
            "note": "Public domain. Chapter 13 is quoted in this lesson."
          },
          {
            "title": "St Justin Martyr, First Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Public domain. Chapter 46: the Word in the world before Christ."
          },
          {
            "title": "OCA: Martyr Justin the Philosopher",
            "url": "https://www.oca.org/saints/lives/2026/06/01/101570-martyr-justin-the-philosopher-and-those-with-him-at-rome",
            "note": "The OCA's life of the saint, 1 June."
          }
        ]
      ],
      [
        "Reading: St Irenaeus on error dressed as truth",
        [
          {
            "title": "St Irenaeus, Against Heresies, Book I Preface, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103100.htm",
            "note": "Public domain, New Advent. The passage read here, sections 1–2."
          },
          {
            "title": "St Irenaeus, Against Heresies (contents)",
            "url": "https://www.newadvent.org/fathers/0103.htm",
            "note": "The whole work, all five books."
          }
        ]
      ],
      [
        "St Irenaeus's answer: the rule of faith and the succession",
        [
          {
            "title": "St Irenaeus, Against Heresies I.8, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103108.htm",
            "note": "Public domain. The mosaic of the king turned into a fox."
          },
          {
            "title": "St Irenaeus, Against Heresies III.3, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103303.htm",
            "note": "Public domain. The succession of the bishops of Rome, and the passage on Rome's \"preeminent authority\"."
          }
        ]
      ],
      [
        "St Athanasius: answering the pagans and the Arians",
        [
          {
            "title": "St Athanasius, Against the Heathen, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2801.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "St Athanasius, On the Incarnation of the Word, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "OCA: Saint Athanasius the Great, Archbishop of Alexandria",
            "url": "https://www.oca.org/saints/lives/2026/01/18/100219-saint-athanasius-the-great-archbishop-of-alexandria",
            "note": "The OCA's life of the saint, 18 January."
          }
        ]
      ],
      [
        "St John of Damascus: On Heresies and the catalogue of errors",
        [
          {
            "title": "St John of Damascus, An Exact Exposition of the Orthodox Faith (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/3304.htm",
            "note": "Public domain, New Advent. The third part of the Fount of Knowledge."
          },
          {
            "title": "St John of Damascus, Writings, tr. Frederic H. Chase (Fathers of the Church vol. 37)",
            "note": "Printed book. Contains the Philosophical Chapters and On Heresies in English."
          },
          {
            "title": "OCA: Venerable John of Damascus",
            "url": "https://www.oca.org/saints/lives/2026/12/04/103473-venerable-john-of-damascus",
            "note": "The OCA's life of the saint, 4 December."
          }
        ]
      ],
      [
        "The method of this curriculum: four steps for every answer",
        [
          {
            "title": "St Irenaeus, Against Heresies, Book I Preface (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103100.htm",
            "note": "Public domain. The model of describing before answering."
          },
          {
            "title": "Exodus 20 (King James Version)",
            "url": "https://ebible.org/eng-kjv/EXO20.htm",
            "note": "Public domain. Verse 16: no false witness, opponents included."
          }
        ]
      ],
      [
        "The fallacies that sink an argument",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Fallacies",
            "url": "https://plato.stanford.edu/entries/fallacies/",
            "note": "Free. A full account of the fallacies from Aristotle to today."
          }
        ]
      ],
      [
        "Scripture as common ground: why both sides quote the Bible",
        [
          {
            "title": "St Vincent of Lérins, Commonitory, tr. C. A. Heurtley (NPNF 2/11, 1894)",
            "url": "https://www.newadvent.org/fathers/3506.htm",
            "note": "Public domain. Chapter 2: why Scripture must be read by what has been believed everywhere, always, by all."
          },
          {
            "title": "1 Timothy 3 (King James Version)",
            "url": "https://ebible.org/eng-kjv/1TI03.htm",
            "note": "Public domain. Verse 15: the pillar and ground of the truth."
          }
        ]
      ],
      [
        "Akriveia and oikonomia: strictness and mercy in the canons",
        [
          {
            "title": "St Basil the Great, Letter 188, tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/3202188.htm",
            "note": "Public domain. Canon 1, quoted in this lesson."
          },
          {
            "title": "The Rudder (Pedalion) of St Nikodemos of the Holy Mountain, tr. D. Cummings",
            "note": "Printed book. The strict reading of the canons on heterodox baptism, with commentary."
          }
        ]
      ],
      [
        "How the Church receives converts: baptism, chrismation or confession",
        [
          {
            "title": "The Council in Trullo (692), canons, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3814.htm",
            "note": "Public domain. Canon 95, quoted in this lesson."
          },
          {
            "title": "The First Council of Constantinople (381), canons, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3808.htm",
            "note": "Public domain. Canon 7 on receiving heretics (on New Advent's page it is the last canon printed)."
          }
        ]
      ],
      [
        "Looking back: how the Church answers",
        [
          {
            "title": "St Irenaeus, Against Heresies (contents)",
            "url": "https://www.newadvent.org/fathers/0103.htm",
            "note": "The model work of Orthodox polemic, to read in full."
          },
          {
            "title": "Fr Georges Florovsky, \"The Limits of the Church\", Church Quarterly Review (1933)",
            "note": "Printed article by Fr Georges Florovsky; the classic case that grace is not wholly bounded by the Church's canonical limits."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 2 · The old heresies come back",
    "lessons": [
      [
        "Context: why the old heresies keep coming back",
        [
          {
            "title": "St John of Damascus, An Exact Exposition of the Orthodox Faith (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/3304.htm",
            "note": "Public domain. The faith that the heresies cut pieces from, set out whole."
          },
          {
            "title": "Jaroslav Pelikan, The Christian Tradition, vol. 1: The Emergence of the Catholic Tradition (100–600)",
            "note": "Printed book by Jaroslav Pelikan. The history of doctrine, heresy by heresy."
          }
        ]
      ],
      [
        "Gnosticism: secret knowledge and an evil world",
        [
          {
            "title": "St Irenaeus, Against Heresies I.8, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103108.htm",
            "note": "Public domain. The mosaic of the king turned into a fox."
          },
          {
            "title": "Catholic Encyclopedia (1909): Gnosticism",
            "url": "https://www.newadvent.org/cathen/06592a.htm",
            "note": "Public domain. A long older account of the Gnostic systems."
          }
        ]
      ],
      [
        "Gnosticism today: the lost gospels and the spiritual elite",
        [
          {
            "title": "The Gospel of Thomas (Early Christian Writings)",
            "url": "https://www.earlychristianwritings.com/thomas.html",
            "note": "Their own text, with several translations and introductions; saying 114 is discussed in this lesson."
          },
          {
            "title": "Elaine Pagels, The Gnostic Gospels (1979)",
            "note": "Printed book by Elaine Pagels. The best-known modern case for the Gnostic texts, read as the other side's best defender."
          }
        ]
      ],
      [
        "Marcion: two gods and a shortened Bible",
        [
          {
            "title": "St Irenaeus, Against Heresies I.27, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103127.htm",
            "note": "Public domain. Cerdo and Marcion; quoted in this lesson."
          },
          {
            "title": "Tertullian, Against Marcion, tr. Peter Holmes (ANF 3, 1885)",
            "url": "https://www.newadvent.org/fathers/0312.htm",
            "note": "Public domain. The fullest ancient answer to Marcion, in five books."
          }
        ]
      ],
      [
        "Marcion today: the angry God of the Old Testament",
        [
          {
            "title": "Luke 24 (King James Version)",
            "url": "https://ebible.org/eng-kjv/LUK24.htm",
            "note": "Public domain. Verse 27: Christ reading Moses and the prophets as about Himself."
          },
          {
            "title": "Catholic Encyclopedia (1910): Marcionites",
            "url": "https://www.newadvent.org/cathen/09645c.htm",
            "note": "Public domain. The history and teaching of Marcion's church."
          }
        ]
      ],
      [
        "Arius: the Son as the first and greatest creature",
        [
          {
            "title": "First Council of Nicaea (325): Creed and canons, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3801.htm",
            "note": "Public domain. The creed with its anathemas against Arius."
          },
          {
            "title": "Catholic Encyclopedia (1907): Arianism",
            "url": "https://www.newadvent.org/cathen/01707c.htm",
            "note": "Public domain. The history of the controversy."
          }
        ]
      ],
      [
        "Reading: Arius's letter to Eusebius of Nicomedia",
        [
          {
            "title": "Theodoret, Ecclesiastical History, Book I, tr. Blomfield Jackson (NPNF 2/3, 1892)",
            "url": "https://www.newadvent.org/fathers/27021.htm",
            "note": "Public domain. Chapter 4 is Arius's letter, read in this lesson."
          }
        ]
      ],
      [
        "Reading: St Athanasius against \"there was once when the Son was not\"",
        [
          {
            "title": "St Athanasius, Discourse I against the Arians, tr. Newman and Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/28161.htm",
            "note": "Public domain. Sections 11 and 19 are read in this lesson."
          },
          {
            "title": "St Athanasius, Four Discourses against the Arians (contents)",
            "url": "https://www.newadvent.org/fathers/2816.htm",
            "note": "Public domain. All four discourses."
          }
        ]
      ],
      [
        "Arius today: Witnesses, Unitarians and \"a god\" in John 1:1",
        [
          {
            "title": "Jehovah's Witnesses: Is the Trinity Doctrine in the Bible? (jw.org)",
            "url": "https://www.jw.org/en/bible-teachings/questions/trinity/",
            "note": "Their own text: the Witnesses' case against the Trinity."
          },
          {
            "title": "St Athanasius, On the Incarnation of the Word, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain. Why only God made man can save."
          }
        ]
      ],
      [
        "The modalists: Sabellius and the one God in three masks",
        [
          {
            "title": "Tertullian, Against Praxeas, tr. Peter Holmes (ANF 3, 1885)",
            "url": "https://www.newadvent.org/fathers/0317.htm",
            "note": "Public domain. The first full answer to modalism; chapter 1 is quoted in this lesson."
          },
          {
            "title": "John 17 (King James Version)",
            "url": "https://ebible.org/eng-kjv/JHN17.htm",
            "note": "Public domain. The Son's prayer to the Father."
          }
        ]
      ],
      [
        "Modalism today: Oneness Pentecostals and the bad analogies",
        [
          {
            "title": "United Pentecostal Church International: Our Beliefs (upci.org)",
            "url": "https://www.upci.org/about/our-beliefs",
            "note": "Their own text: the Oneness statement of faith, paraphrased in this lesson."
          },
          {
            "title": "The Didache, tr. M. B. Riddle (ANF 7, 1886)",
            "url": "https://www.newadvent.org/fathers/0714.htm",
            "note": "Public domain. Chapter 7: baptism in the name of the Father, and of the Son, and of the Holy Spirit."
          }
        ]
      ],
      [
        "Nestorius: two sons and the Theotokos",
        [
          {
            "title": "Council of Ephesus (431), with St Cyril's anathemas, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3810.htm",
            "note": "Public domain. The first anathema is quoted in this lesson."
          },
          {
            "title": "Catholic Encyclopedia (1911): Nestorius and Nestorianism",
            "url": "https://www.newadvent.org/cathen/10755a.htm",
            "note": "Public domain. The history, including the Bazaar of Heracleides."
          }
        ]
      ],
      [
        "Nestorius's pattern today: \"the mother of Jesus, not of God\"",
        [
          {
            "title": "Common Christological Declaration between the Catholic Church and the Assyrian Church of the East (1994)",
            "url": "https://www.vatican.va/content/john-paul-ii/en/speeches/1994/november/documents/hf_jp-ii_spe_19941111_dichiarazione-cristologica.html",
            "note": "The 1994 declaration discussed in this lesson."
          },
          {
            "title": "Luke 1 (King James Version)",
            "url": "https://ebible.org/eng-kjv/LUK01.htm",
            "note": "Public domain. Verse 43: \"the mother of my Lord\"."
          }
        ]
      ],
      [
        "The iconoclasts: image and idol",
        [
          {
            "title": "St John of Damascus, On Holy Images, tr. Mary H. Allies (1898), Fordham Medieval Sourcebook",
            "url": "https://sourcebooks.fordham.edu/basis/johndamascus-images.asp",
            "note": "Public domain. The passage quoted is from the first apology."
          },
          {
            "title": "Second Council of Nicaea (787), tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3819.htm",
            "note": "Public domain. The definition on the veneration of icons."
          }
        ]
      ],
      [
        "Iconoclasm today: the Reformed case against images",
        [
          {
            "title": "John Calvin, Institutes of the Christian Religion, tr. Henry Beveridge (1845), CCEL",
            "url": "https://www.ccel.org/ccel/calvin/institutes.html",
            "note": "Their own text. Book I, chapter 11 on images; section 12 is quoted."
          },
          {
            "title": "The Westminster Larger Catechism (1648), CCEL",
            "url": "https://www.ccel.org/ccel/anonymous/westminster2.html",
            "note": "Their own text. Question 109 on the second commandment."
          }
        ]
      ],
      [
        "Looking back: the pattern of the old heresies",
        [
          {
            "title": "St Irenaeus, Against Heresies (contents)",
            "url": "https://www.newadvent.org/fathers/0103.htm",
            "note": "Public domain. The first great map of heresies and their answer."
          },
          {
            "title": "Catholic Encyclopedia (1910): Iconoclasm",
            "url": "https://www.newadvent.org/cathen/07620a.htm",
            "note": "Public domain. The history of the two iconoclasms."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 3 · Judaism",
    "lessons": [
      [
        "Context: why Judaism is answered differently",
        [
          {
            "title": "Romans 9 (King James Version)",
            "url": "https://ebible.org/eng-kjv/ROM09.htm",
            "note": "Public domain. Paul's sorrow for his kinsmen and their gifts."
          },
          {
            "title": "Romans 11 (King James Version)",
            "url": "https://ebible.org/eng-kjv/ROM11.htm",
            "note": "Public domain. The olive tree and the branches."
          }
        ]
      ],
      [
        "What Judaism teaches: the Thirteen Principles and the movements today",
        [
          {
            "title": "Judaism 101: What Do Jews Believe? (jewfaq.org)",
            "url": "https://www.jewfaq.org/beliefs",
            "note": "Their own explanation: Maimonides' Thirteen Principles and how Jews hold them."
          },
          {
            "title": "Judaism 101: Movements of Judaism (jewfaq.org)",
            "url": "https://www.jewfaq.org/movements",
            "note": "Their own account of Orthodox, Conservative, Reform and Reconstructionist Judaism."
          }
        ]
      ],
      [
        "From the Temple to the rabbis: how rabbinic Judaism arose",
        [
          {
            "title": "Judaism 101: What Is Judaism? (jewfaq.org)",
            "url": "https://www.jewfaq.org/judaism",
            "note": "Their own account of Judaism and its history."
          },
          {
            "title": "Acts 15 (King James Version)",
            "url": "https://ebible.org/eng-kjv/ACT15.htm",
            "note": "Public domain. The Council of Jerusalem, one step in the parting of the ways."
          }
        ]
      ],
      [
        "The Talmud and the Oral Torah",
        [
          {
            "title": "Jewish Encyclopedia (1906): Talmud",
            "url": "https://www.jewishencyclopedia.com/articles/14213-talmud",
            "note": "Public domain. A full older Jewish account of the Talmud."
          },
          {
            "title": "Judaism 101: Torah (jewfaq.org)",
            "url": "https://www.jewfaq.org/torah",
            "note": "Their own explanation of the written and oral Torah."
          }
        ]
      ],
      [
        "The Septuagint and the Masoretic text: which Old Testament?",
        [
          {
            "title": "Catholic Encyclopedia (1912): Septuagint Version",
            "url": "https://www.newadvent.org/cathen/13722a.htm",
            "note": "Public domain. The history of the Greek Old Testament."
          },
          {
            "title": "St Justin Martyr, Dialogue with Trypho, chapters 69–88, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/01286.htm",
            "note": "Public domain. Chapters 71–73: Justin's charge about the Septuagint."
          }
        ]
      ],
      [
        "Isaiah 7:14: almah and parthenos",
        [
          {
            "title": "Isaiah 7, JPS 1917 translation (Mechon Mamre)",
            "url": "https://mechon-mamre.org/p/pt/pt1007.htm",
            "note": "Public domain. The Jewish translation quoted in this lesson."
          },
          {
            "title": "Isaiah 7, Brenton's Septuagint (1844)",
            "url": "https://ebible.org/eng-Brenton/ISA07.htm",
            "note": "Public domain. The Greek Old Testament in English."
          }
        ]
      ],
      [
        "The Messiah: what Judaism expects and why it rejects Jesus",
        [
          {
            "title": "Judaism 101: Mashiach, the Messiah (jewfaq.org)",
            "url": "https://www.jewfaq.org/mashiach",
            "note": "Their own text: what the Messiah must do, and why Jews do not accept Jesus."
          },
          {
            "title": "St Justin Martyr, Dialogue with Trypho, chapters 31–47, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/01283.htm",
            "note": "Public domain. Chapter 32: the two advents."
          }
        ]
      ],
      [
        "Reading: Isaiah 52:13–53:12 in the Jewish translation, and the rabbinic reading",
        [
          {
            "title": "Isaiah 53, JPS 1917 translation (Mechon Mamre)",
            "url": "https://mechon-mamre.org/p/pt/pt1053.htm",
            "note": "Public domain. The text read in this lesson; 52:13–15 is on the page for chapter 52."
          },
          {
            "title": "Jewish Encyclopedia (1906): Messiah",
            "url": "https://www.jewishencyclopedia.com/articles/10729-messiah",
            "note": "Public domain. The Jewish readings of the suffering servant and the Messiah."
          }
        ]
      ],
      [
        "Reading: St Justin's Dialogue with Trypho on the crucified Messiah",
        [
          {
            "title": "St Justin Martyr, Dialogue with Trypho, chapters 89–108, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/01287.htm",
            "note": "Public domain. Chapters 89–90 are read in this lesson."
          },
          {
            "title": "St Justin Martyr, Dialogue with Trypho, chapters 125–142 (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/01289.htm",
            "note": "Public domain. Chapter 142: how the dialogue ends."
          }
        ]
      ],
      [
        "Daniel's seventy weeks and the sceptre of Judah: the time of the Messiah",
        [
          {
            "title": "Daniel 9 (King James Version)",
            "url": "https://ebible.org/eng-kjv/DAN09.htm",
            "note": "Public domain. Verses 24–27."
          },
          {
            "title": "Haggai 2 (King James Version)",
            "url": "https://ebible.org/eng-kjv/HAG02.htm",
            "note": "Public domain. The glory of the latter house."
          }
        ]
      ],
      [
        "The Shema and the Trinity: is God one?",
        [
          {
            "title": "Deuteronomy 6, JPS 1917 translation (Mechon Mamre)",
            "url": "https://mechon-mamre.org/p/pt/pt0506.htm",
            "note": "Public domain. The Shema in the Jewish translation."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Doctrine (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/one-god-one-father",
            "note": "Free on oca.org. One God, because one Father, with His Word and Spirit."
          }
        ]
      ],
      [
        "The Word and the Angel of the Lord: plurality in Israel's own Scriptures",
        [
          {
            "title": "St Justin Martyr, Dialogue with Trypho, chapters 55–68, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/01285.htm",
            "note": "Public domain. Chapter 56 is quoted in this lesson."
          },
          {
            "title": "Alan F. Segal, Two Powers in Heaven (1977)",
            "note": "Printed book by Alan Segal, a Jewish scholar: the rabbinic reports of the \"two powers\" heresy."
          }
        ]
      ],
      [
        "The Law: was the Torah given for ever?",
        [
          {
            "title": "Jeremiah 31 (King James Version)",
            "url": "https://ebible.org/eng-kjv/JER31.htm",
            "note": "Public domain. The new covenant, verses 31–33."
          },
          {
            "title": "St Justin Martyr, Dialogue with Trypho, chapters 10–30, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/01282.htm",
            "note": "Public domain. Chapters 10–11: Trypho's objection and Justin's answer on the Law."
          }
        ]
      ],
      [
        "Atonement without a Temple: repentance, sacrifice and the Cross",
        [
          {
            "title": "Hosea 14, JPS 1917 translation (Mechon Mamre)",
            "url": "https://mechon-mamre.org/p/pt/pt1314.htm",
            "note": "Public domain. Verse 3: \"the offering of our lips\"."
          },
          {
            "title": "Hebrews 10 (King James Version)",
            "url": "https://ebible.org/eng-kjv/HEB10.htm",
            "note": "Public domain. The one sacrifice and the shadows."
          }
        ]
      ],
      [
        "The Jewish case against Jesus, and the Church's answer",
        [
          {
            "title": "Judaism 101: Mashiach, the Messiah (jewfaq.org)",
            "url": "https://www.jewfaq.org/mashiach",
            "note": "Their own text, including why Jews do not believe Jesus is the Messiah."
          },
          {
            "title": "Jeremiah 22 (King James Version)",
            "url": "https://ebible.org/eng-kjv/JER22.htm",
            "note": "Public domain. Verse 30, on Jeconiah."
          }
        ]
      ],
      [
        "The Church's own record toward the Jews, told plainly",
        [
          {
            "title": "St John Chrysostom, Discourses against Judaizing Christians, tr. Paul W. Harkins (Fathers of the Church vol. 68, 1979)",
            "note": "Printed book, in copyright; the homilies discussed and paraphrased in this lesson."
          },
          {
            "title": "Robert L. Wilken, John Chrysostom and the Jews (1983)",
            "note": "Printed book by Robert Wilken: the homilies in their setting."
          }
        ]
      ],
      [
        "Orthodox Christians who stood with the Jews",
        [
          {
            "title": "OCA: Righteous Martyr Maria Skobtsova",
            "url": "https://www.oca.org/saints/lives/2026/07/20/108892-righteous-martyr-maria-skobtsova",
            "note": "The OCA's life of St Maria, 20 July."
          },
          {
            "title": "OCA: Priestmartyr Demetrius Klepinine",
            "url": "https://www.oca.org/saints/lives/2026/07/20/108893-priestmartyr-demetrius-klepinine",
            "note": "The OCA's life of St Dimitri Klepinin."
          },
          {
            "title": "United States Holocaust Memorial Museum: Bulgaria (Holocaust Encyclopedia)",
            "url": "https://encyclopedia.ushmm.org/content/en/article/bulgaria",
            "note": "The rescue in Bulgaria and the deportations from occupied Thrace and Macedonia."
          }
        ]
      ],
      [
        "Looking back: Judaism and the Church",
        [
          {
            "title": "St Justin Martyr, Dialogue with Trypho (contents), tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0128.htm",
            "note": "Public domain. The whole dialogue, to read in full."
          },
          {
            "title": "Isaiah 53, JPS 1917 translation (Mechon Mamre)",
            "url": "https://mechon-mamre.org/p/pt/pt1053.htm",
            "note": "Public domain."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 4 · Rome: the questions of the schism",
    "lessons": [
      [
        "Context: Rome, the nearest of the separated",
        [
          {
            "title": "Catechism of the Catholic Church (vatican.va)",
            "url": "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
            "note": "Their own text: the Catholic Church's official catechism (1992; in copyright, paraphrased in this stage)."
          },
          {
            "title": "A. Edward Siecienski, Beards, Azymes, and Purgatory: The Other Issues that Divided East and West (2023)",
            "note": "Printed book by A. Edward Siecienski: the history of the lesser disputes."
          }
        ]
      ],
      [
        "How the Catholic Church sees herself and the Orthodox",
        [
          {
            "title": "Second Vatican Council, Unitatis Redintegratio (1964)",
            "url": "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_unitatis-redintegratio_en.html",
            "note": "Their own text. Sections 14–18 on the Eastern churches."
          },
          {
            "title": "Catechism of the Catholic Church (vatican.va)",
            "url": "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
            "note": "Their own text. Paragraphs 816 and 880–882."
          }
        ]
      ],
      [
        "The filioque: what the Creed says and what each side means",
        [
          {
            "title": "Council of Ephesus (431), tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3810.htm",
            "note": "Public domain. Canon 7, on composing a different faith."
          },
          {
            "title": "Catholic Encyclopedia (1909): Filioque",
            "url": "https://www.newadvent.org/cathen/06073a.htm",
            "note": "Public domain. The older Catholic account of the history and doctrine."
          }
        ]
      ],
      [
        "From Toledo to 1014: how \"and the Son\" entered the Creed",
        [
          {
            "title": "A. Edward Siecienski, The Filioque: History of a Doctrinal Controversy (2010)",
            "note": "Printed book by A. Edward Siecienski: the standard history, from the Fathers to the dialogues."
          },
          {
            "title": "Catholic Encyclopedia (1909): Filioque",
            "url": "https://www.newadvent.org/cathen/06073a.htm",
            "note": "Public domain. Toledo, Aachen, Leo III and 1014."
          }
        ]
      ],
      [
        "The Latin case for the filioque: Augustine and the Father \"principally\"",
        [
          {
            "title": "St Augustine, On the Trinity, Book XV, tr. Arthur West Haddan (NPNF 1/3, 1887)",
            "url": "https://www.newadvent.org/fathers/130115.htm",
            "note": "Public domain. Chapter 17, section 29, is quoted in this lesson."
          },
          {
            "title": "Catechism of the Catholic Church (vatican.va)",
            "url": "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
            "note": "Their own text. Paragraphs 246–248 on the filioque."
          }
        ]
      ],
      [
        "St Photios and the Mystagogy: the Orthodox case against the filioque",
        [
          {
            "title": "St Photios, The Mystagogy of the Holy Spirit (modern English translations)",
            "note": "Printed book, in copyright; St Photios's argument is paraphrased in this lesson."
          },
          {
            "title": "OCA: Saint Photius, Patriarch of Constantinople",
            "url": "https://www.oca.org/saints/lives/2026/02/06/100442-saint-photius-patriarch-of-constantinople",
            "note": "The OCA's life of the saint, 6 February."
          }
        ]
      ],
      [
        "\"Through the Son\": St Maximus, Gregory of Cyprus and St Gregory Palamas",
        [
          {
            "title": "A. Edward Siecienski, The Filioque: History of a Doctrinal Controversy (2010)",
            "note": "Printed book. Chapters on Maximus's Letter to Marinus, Gregory of Cyprus and Palamas."
          },
          {
            "title": "John 15 (King James Version)",
            "url": "https://ebible.org/eng-kjv/JHN15.htm",
            "note": "Public domain. Verse 26, the text all three interpret."
          }
        ]
      ],
      [
        "The filioque since 1995: clarifications, consultations and Nicaea 2025",
        [
          {
            "title": "North American Orthodox–Catholic Theological Consultation, The Filioque: A Church-Dividing Issue? (2003)",
            "url": "https://ecumenism.net/archive/docu/2003_na-o-rc_filioque_en.php",
            "note": "The agreed statement and its recommendations; also discusses the 1995 Clarification."
          },
          {
            "title": "Pope Leo XIV, In Unitate Fidei (23 November 2025)",
            "url": "https://www.vatican.va/content/leo-xiv/en/apost_letters/documents/20251123-in-unitate-fidei.html",
            "note": "Their own text: the apostolic letter for the 1,700th anniversary of Nicaea."
          }
        ]
      ],
      [
        "Peter in the New Testament: the rock, the keys and the sheep",
        [
          {
            "title": "Matthew 16 (King James Version)",
            "url": "https://ebible.org/eng-kjv/MAT16.htm",
            "note": "Public domain. Verses 16–19."
          },
          {
            "title": "Catechism of the Catholic Church (vatican.va)",
            "url": "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
            "note": "Their own text. Paragraphs 552–553 and 881."
          }
        ]
      ],
      [
        "The Fathers on the rock: Origen, Cyprian, Chrysostom and Augustine",
        [
          {
            "title": "St Cyprian, On the Unity of the Church, tr. Robert Ernest Wallis (ANF 5, 1886)",
            "url": "https://www.newadvent.org/fathers/050701.htm",
            "note": "Public domain. Chapters 4–5 are quoted in this lesson."
          },
          {
            "title": "St John Chrysostom, Homily 54 on Matthew, tr. Prevost and Riddle (NPNF 1/10, 1888)",
            "url": "https://www.newadvent.org/fathers/200154.htm",
            "note": "Public domain."
          },
          {
            "title": "Origen, Commentary on Matthew, Book XII, tr. John Patrick (ANF 9, 1896)",
            "url": "https://www.newadvent.org/fathers/101612.htm",
            "note": "Public domain. Section 10 is quoted."
          }
        ]
      ],
      [
        "Rome's place in the first millennium: Ignatius, Irenaeus, Leo and Hormisdas",
        [
          {
            "title": "St Ignatius, Epistle to the Romans, tr. Roberts and Donaldson (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0107.htm",
            "note": "Public domain. The salutation is quoted."
          },
          {
            "title": "Council of Chalcedon (451), tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3811.htm",
            "note": "Public domain. The acclamations after the reading of Leo's Tome."
          }
        ]
      ],
      [
        "The canons on the great sees: Nicaea, Constantinople, Sardica and Chalcedon",
        [
          {
            "title": "First Council of Nicaea (325), canons, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3801.htm",
            "note": "Public domain. Canon 6 is quoted."
          },
          {
            "title": "Council of Chalcedon (451), canons, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3811.htm",
            "note": "Public domain. Canon 28 is quoted."
          }
        ]
      ],
      [
        "Pope Honorius: a pope condemned by an ecumenical council",
        [
          {
            "title": "Third Council of Constantinople (680–681), tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3813.htm",
            "note": "Public domain. The acclamations quoted in this lesson."
          },
          {
            "title": "Catholic Encyclopedia (1910): Pope Honorius I",
            "url": "https://www.newadvent.org/cathen/07452a.htm",
            "note": "Public domain. The Catholic defence of Honorius at its fullest."
          }
        ]
      ],
      [
        "Reading: St Gregory the Great against the title \"universal bishop\"",
        [
          {
            "title": "St Gregory the Great, Letter to the Emperor Maurice (Book VII, Letter 33), tr. James Barmby (NPNF 2/12, 1895)",
            "url": "https://www.newadvent.org/fathers/360207033.htm",
            "note": "Public domain. The first passage."
          },
          {
            "title": "St Gregory the Great, Letters to Eulogius and Anastasius (Book V, Letter 43) and to Eulogius (Book VIII, Letter 30), tr. James Barmby (NPNF 2/12, 1895)",
            "url": "https://www.newadvent.org/fathers/360205043.htm",
            "note": "Public domain. The second passage; Book VIII, Letter 30 (the third) is at the same site."
          },
          {
            "title": "St Gregory the Great, Letter to the Emperor Maurice (Book V, Letter 20), tr. James Barmby (NPNF 2/12, 1895)",
            "url": "https://www.newadvent.org/fathers/360205020.htm",
            "note": "Public domain. The passage on Peter's \"care and principality\" quoted in the Catholic reply."
          }
        ]
      ],
      [
        "From primacy to supremacy: the Dictatus Papae and Unam Sanctam",
        [
          {
            "title": "Dictatus Papae (1075), tr. Ernest F. Henderson (1910), Fordham Medieval Sourcebook",
            "url": "https://sourcebooks.fordham.edu/source/g7-dictpap.asp",
            "note": "Public domain. The propositions quoted in this lesson."
          },
          {
            "title": "Boniface VIII, Unam Sanctam (1302), Papal Encyclicals Online",
            "url": "https://www.papalencyclicals.net/bon08/b8unam.htm",
            "note": "Their own text; paraphrased in this lesson."
          }
        ]
      ],
      [
        "Vatican I (1869–1870): the council and its minority",
        [
          {
            "title": "Catholic Encyclopedia (1912): Vatican Council",
            "url": "https://www.newadvent.org/cathen/15303a.htm",
            "note": "Public domain. The Catholic history of the council, with the votes."
          },
          {
            "title": "Decrees of the First Vatican Council (Papal Encyclicals Online)",
            "url": "https://www.papalencyclicals.net/councils/ecum20.htm",
            "note": "Their own text: Dei Filius and Pastor Aeternus."
          }
        ]
      ],
      [
        "Reading: Pastor Aeternus on the infallible teaching of the Roman Pontiff (1870)",
        [
          {
            "title": "Philip Schaff, The Creeds of Christendom, vol. 2 (1877): the Vatican decrees, tr. Henry Edward Manning (1871)",
            "url": "https://ccel.org/ccel/schaff/creeds2/creeds2.v.ii.iii.html",
            "note": "Public domain, CCEL. The Latin and English of Pastor Aeternus quoted in this lesson."
          },
          {
            "title": "Decrees of the First Vatican Council (Papal Encyclicals Online)",
            "url": "https://www.papalencyclicals.net/councils/ecum20.htm",
            "note": "Their own text in a modern translation."
          }
        ]
      ],
      [
        "Infallibility answered: the Encyclicals of 1848 and 1895, and the Catholic reply",
        [
          {
            "title": "Encyclical of the Eastern Patriarchs (1848), Orthodox Christian Information Center",
            "url": "https://www.orthodoxinfo.com/ecumenism/encyc_1848.aspx",
            "note": "The Orthodox answer, paraphrased in this lesson."
          },
          {
            "title": "The Patriarchal Encyclical of 1895 (Fordham Modern History Sourcebook)",
            "url": "https://sourcebooks.fordham.edu/mod/1895orthodoxencyclical.asp",
            "note": "Patriarch Anthimos VII's reply to Leo XIII, paraphrased in this lesson."
          },
          {
            "title": "Pope Leo XIII, Praeclara Gratulationis (1894)",
            "url": "https://www.vatican.va/content/leo-xiii/en/apost_letters/documents/hf_l-xiii_apl_18940620_praeclara-gratulationis.html",
            "note": "Their own text: the letter the 1895 encyclical answers."
          }
        ]
      ],
      [
        "Primacy in the Orthodox view today: Ravenna, Chieti and the quarrel over \"first\"",
        [
          {
            "title": "Ravenna Document (2007), Joint International Commission",
            "url": "https://www.christianunity.va/content/unitacristiani/en/dialoghi/sezione-orientale/chiese-ortodosse-di-tradizione-bizantina/commissione-mista-internazionale-per-il-dialogo-teologico-tra-la/documenti-di-dialogo/testo-in-inglese.html",
            "note": "The joint text on conciliarity and authority."
          },
          {
            "title": "Chieti Document (2016), Joint International Commission",
            "url": "https://www.christianunity.va/content/unitacristiani/en/dialoghi/sezione-orientale/chiese-ortodosse-di-tradizione-bizantina/commissione-mista-internazionale-per-il-dialogo-teologico-tra-la/documenti-di-dialogo/testo-in-inglese1.html",
            "note": "Synodality and primacy during the first millennium."
          },
          {
            "title": "Alexandria Document (2023), Joint International Commission",
            "url": "https://www.christianunity.va/content/unitacristiani/en/dialoghi/sezione-orientale/chiese-ortodosse-di-tradizione-bizantina/commissione-mista-internazionale-per-il-dialogo-teologico-tra-la/documenti-di-dialogo/document-d-alexandrie---synodalite-et-primaute-au-deuxieme-mille.html",
            "note": "Synodality and primacy in the second millennium and today."
          }
        ]
      ],
      [
        "The azymes: leavened and unleavened bread",
        [
          {
            "title": "John 18 (King James Version)",
            "url": "https://ebible.org/eng-kjv/JHN18.htm",
            "note": "Public domain. Verse 28, the Johannine chronology."
          },
          {
            "title": "A. Edward Siecienski, Beards, Azymes, and Purgatory (2023)",
            "note": "Printed book by A. Edward Siecienski, with a full chapter on the azymes."
          }
        ]
      ],
      [
        "1054: Humbert, Cerularius and the anathemas",
        [
          {
            "title": "Common Declaration of Pope Paul VI and Patriarch Athenagoras I (7 December 1965)",
            "url": "https://www.vatican.va/content/paul-vi/en/speeches/1965/documents/hf_p-vi_spe_19651207_common-declaration.html",
            "note": "The lifting of the anathemas of 1054."
          },
          {
            "title": "Steven Runciman, The Eastern Schism (1955)",
            "note": "Printed book by Steven Runciman: the papacy and the Eastern churches in the 11th and 12th centuries."
          }
        ]
      ],
      [
        "1182 and 1204: the massacre of the Latins and the sack of Constantinople",
        [
          {
            "title": "Niketas Choniates: The Sack of Constantinople (1204), Fordham Medieval Sourcebook",
            "url": "https://sourcebooks.fordham.edu/source/choniates1.asp",
            "note": "The eyewitness account, paraphrased in this lesson."
          },
          {
            "title": "Jonathan Phillips, The Fourth Crusade and the Sack of Constantinople (2004)",
            "note": "Printed book by Jonathan Phillips."
          }
        ]
      ],
      [
        "Lyons (1274): the union of an emperor",
        [
          {
            "title": "Second Council of Lyons (1274), Papal Encyclicals Online",
            "url": "https://www.papalencyclicals.net/councils/ecum14.htm",
            "note": "Their own text: the decrees, including the procession of the Spirit as from one principle."
          },
          {
            "title": "Deno John Geanakoplos, Emperor Michael Palaeologus and the West (1959)",
            "note": "Printed book by Deno Geanakoplos: the politics of the union."
          }
        ]
      ],
      [
        "Florence (1438–1439): the union that was discussed and still failed",
        [
          {
            "title": "Council of Basel-Ferrara-Florence, decrees (Papal Encyclicals Online)",
            "url": "https://www.papalencyclicals.net/councils/ecum17.htm",
            "note": "Their own text, including Laetentur Caeli."
          },
          {
            "title": "Catholic Encyclopedia (1909): Council of Florence",
            "url": "https://www.newadvent.org/cathen/06111a.htm",
            "note": "Public domain. The Catholic history of the council."
          }
        ]
      ],
      [
        "St Mark of Ephesus: the one who did not sign",
        [
          {
            "title": "St Mark of Ephesus and the False Union of Florence (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/stmark.aspx",
            "note": "The Orthodox account of his life and his stand."
          },
          {
            "title": "OCA: Saint Mark, Archbishop of Ephesus",
            "url": "https://www.oca.org/saints/lives/2026/01/19/100228-saint-mark-archbishop-of-ephesus",
            "note": "The OCA's life of the saint, 19 January."
          }
        ]
      ],
      [
        "Looking back: the questions of the schism",
        [
          {
            "title": "Ravenna Document (2007), Joint International Commission",
            "url": "https://www.christianunity.va/content/unitacristiani/en/dialoghi/sezione-orientale/chiese-ortodosse-di-tradizione-bizantina/commissione-mista-internazionale-per-il-dialogo-teologico-tra-la/documenti-di-dialogo/testo-in-inglese.html",
            "note": "Where the dialogue stands on primacy."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book. Chapter 3, \"The Great Schism\"."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 5 · Rome: the questions since",
    "lessons": [
      [
        "Context: Rome after the schism, and the questions that grew apart",
        [
          {
            "title": "Catechism of the Catholic Church (vatican.va)",
            "url": "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
            "note": "Rome's own summary of its faith, free to read on vatican.va (in copyright, so paraphrased in these lessons)."
          },
          {
            "title": "The Patriarchal Encyclical of 1895 (Fordham Modern History Sourcebook)",
            "url": "https://sourcebooks.web.fordham.edu/mod/1895orthodoxencyclical.asp",
            "note": "Patriarch Anthimos VII's reply to Leo XIII, listing the Western innovations since the schism."
          },
          {
            "title": "Encyclical of the Eastern Patriarchs, 1848 (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/encyc_1848.aspx",
            "note": "The four Eastern patriarchs' reply to Pius IX."
          }
        ]
      ],
      [
        "Created grace: what Rome holds",
        [
          {
            "title": "St Thomas Aquinas, Summa Theologiae I-II, question 110: the grace of God as regards its essence",
            "url": "https://www.newadvent.org/summa/2110.htm",
            "note": "Public-domain English Dominican translation, New Advent. The classic statement of created grace."
          },
          {
            "title": "Council of Trent, Session VI: Decree on Justification, tr. J. Waterworth (1848)",
            "url": "https://history.hanover.edu/texts/trent/ct06.html",
            "note": "Hanover Historical Texts. Canon 11 on grace \"inherent\" in the justified."
          }
        ]
      ],
      [
        "Uncreated energies: the Orthodox answer to created grace",
        [
          {
            "title": "OCA: Saint Gregory Palamas, Archbishop of Thessalonica",
            "url": "https://www.oca.org/saints/lives/2026/11/14/103303-saint-gregory-palamas-archbishop-of-thessalonica",
            "note": "The OCA's life of the saint and his defence of the hesychasts."
          },
          {
            "title": "St Basil, Letter 234, tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/3202234.htm",
            "note": "Public domain, New Advent. We know God from His energies, not His essence."
          },
          {
            "title": "Vladimir Lossky, The Mystical Theology of the Eastern Church",
            "note": "Printed book. Chapter 4, 'Uncreated Energies', sets the Orthodox teaching against created grace."
          }
        ]
      ],
      [
        "The beatific vision: seeing the essence of God?",
        [
          {
            "title": "Benedict XII, Benedictus Deus (1336) (Papal Encyclicals Online)",
            "url": "https://www.papalencyclicals.net/ben12/b12bdeus.htm",
            "note": "The papal definition of the vision of the divine essence."
          },
          {
            "title": "St Thomas Aquinas, Summa Theologiae I, question 12: how God is known by us",
            "url": "https://www.newadvent.org/summa/1012.htm",
            "note": "New Advent. Whether a created intellect can see the essence of God."
          },
          {
            "title": "Marcus Plested, Orthodox Readings of Aquinas",
            "note": "Printed book (2012), by an Orthodox scholar, on Byzantine reception of Aquinas."
          }
        ]
      ],
      [
        "Augustine and original sin: the Western case",
        [
          {
            "title": "Catechism of the Catholic Church, paragraphs 396–409 (vatican.va)",
            "url": "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
            "note": "Original sin \"contracted\" not \"committed\" (in copyright; paraphrased in the lesson)."
          },
          {
            "title": "Council of Carthage (419), the Code of the African Church (NPNF 2/14)",
            "url": "https://www.newadvent.org/fathers/3816.htm",
            "note": "Public domain, New Advent. Includes the canons against Pelagius on infant baptism, received in the Orthodox canonical collection."
          },
          {
            "title": "International Theological Commission, The Hope of Salvation for Infants Who Die Without Being Baptised (2007)",
            "url": "https://www.vatican.va/roman_curia/congregations/cfaith/cti_documents/rc_con_cfaith_doc_20070419_un-baptised-infants_en.html",
            "note": "The modern Catholic reconsideration of limbo."
          }
        ]
      ],
      [
        "Ancestral sin: the Orthodox reading of Romans 5:12",
        [
          {
            "title": "OCA Questions and Answers: Original Sin",
            "url": "https://www.oca.org/questions/teaching/original-sin",
            "note": "The OCA's short answer on ancestral sin."
          },
          {
            "title": "Fr John Romanides, The Ancestral Sin, tr. George Gabriel",
            "note": "Printed book; Romanides's 1957 dissertation, the main modern Orthodox argument against inherited guilt."
          }
        ]
      ],
      [
        "Reading: the Council of Trent's Decree on Original Sin (1546)",
        [
          {
            "title": "Council of Trent, Session V: Decree concerning Original Sin, tr. J. Waterworth (1848)",
            "url": "https://history.hanover.edu/texts/trent/ct05.html",
            "note": "Hanover Historical Texts, public domain. The text read in this lesson."
          }
        ]
      ],
      [
        "Reading: St John Chrysostom on Romans 5:12",
        [
          {
            "title": "St John Chrysostom, Homily 10 on Romans, tr. Walker, Sheppard, Browne, rev. Stevens (NPNF 1/11, 1889)",
            "url": "https://www.newadvent.org/fathers/210210.htm",
            "note": "Public domain, New Advent. The text read in this lesson."
          },
          {
            "title": "OCA: Saint John Chrysostom, Archbishop of Constantinople",
            "url": "https://www.oca.org/saints/lives/2026/11/13/103292-saint-john-chrysostom-archbishop-of-constantinople",
            "note": "The OCA's life of the saint."
          }
        ]
      ],
      [
        "Augustine's standing among the Orthodox: where writers differ",
        [
          {
            "title": "OCA: Blessed Augustine, Bishop of Hippo",
            "url": "https://www.oca.org/saints/lives/2026/06/15/101736-blessed-augustine-bishop-of-hippo",
            "note": "His commemoration in the Orthodox calendar."
          },
          {
            "title": "Fr Seraphim Rose, The Place of Blessed Augustine in the Orthodox Church",
            "note": "Printed book (St Herman of Alaska Brotherhood). The case for honouring Augustine as a Father."
          },
          {
            "title": "Christos Yannaras, Orthodoxy and the West",
            "note": "Printed book. The case that Augustine stands at the root of the Western divergence."
          }
        ]
      ],
      [
        "Purgatory: the Catholic case",
        [
          {
            "title": "Council of Trent, Session XXV: Decree concerning Purgatory, tr. J. Waterworth (1848)",
            "url": "https://history.hanover.edu/texts/trent/ct25.html",
            "note": "Hanover Historical Texts. Quoted in the lesson."
          },
          {
            "title": "Benedict XVI, Spe Salvi (2007)",
            "url": "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html",
            "note": "Sections 45–48: purgatory as the purifying encounter with Christ."
          }
        ]
      ],
      [
        "Prayer for the dead without purgatory: the Orthodox answer",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Eternal Life (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/eternal-life",
            "note": "The OCA's catechism on death, the departed and the life to come."
          },
          {
            "title": "OCA: Saint Mark, Archbishop of Ephesus",
            "url": "https://www.oca.org/saints/lives/2026/01/19/100228-saint-mark-archbishop-of-ephesus",
            "note": "The saint who answered purgatory at Ferrara–Florence (taught in Stage 4)."
          },
          {
            "title": "The Patriarchal Encyclical of 1895, section 12 (Fordham Sourcebook)",
            "url": "https://sourcebooks.web.fordham.edu/mod/1895orthodoxencyclical.asp",
            "note": "Prayer for the departed set against purgatorial fire and the treasury of merits."
          }
        ]
      ],
      [
        "Indulgences and the treasury of merit",
        [
          {
            "title": "Paul VI, Indulgentiarum Doctrina (1 January 1967)",
            "url": "https://www.vatican.va/content/paul-vi/en/apost_constitutions/documents/hf_p-vi_apc_01011967_indulgentiarum-doctrina.html",
            "note": "The modern Catholic doctrine of indulgences, from Rome's own text."
          },
          {
            "title": "Council of Trent, Session XXV: Decree concerning Indulgences, tr. J. Waterworth (1848)",
            "url": "https://history.hanover.edu/texts/trent/ct25.html",
            "note": "Trent's own admission of the abuses."
          }
        ]
      ],
      [
        "The Immaculate Conception: Ineffabilis Deus (1854)",
        [
          {
            "title": "Pius IX, Ineffabilis Deus (1854) (Papal Encyclicals Online)",
            "url": "https://www.papalencyclicals.net/pius09/p9ineff.htm",
            "note": "The bull of definition, Rome's own text (paraphrased in the lesson)."
          },
          {
            "title": "Catechism of the Catholic Church, paragraphs 490–493 (vatican.va)",
            "url": "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
            "note": "The Immaculate Conception in the Catechism."
          }
        ]
      ],
      [
        "The All-holy Theotokos: why the Orthodox do not accept the Immaculate Conception",
        [
          {
            "title": "OCA: Conception of the Most Holy Theotokos by Saint Anna (9 December)",
            "url": "https://www.oca.org/saints/lives/2026/12/09/103506-conception-of-the-most-holy-theotokos-by-saint-anna",
            "note": "The Orthodox feast of her conception."
          },
          {
            "title": "St John Maximovitch, The Orthodox Veneration of the Mother of God",
            "note": "Printed book (St Herman of Alaska Brotherhood); includes his answer to the dogma of 1854."
          },
          {
            "title": "The Patriarchal Encyclical of 1895, section 13 (Fordham Sourcebook)",
            "url": "https://sourcebooks.web.fordham.edu/mod/1895orthodoxencyclical.asp",
            "note": "The Orthodox reply to the dogma of 1854."
          }
        ]
      ],
      [
        "The Assumption (1950) and the Dormition (15 August)",
        [
          {
            "title": "Pius XII, Munificentissimus Deus (1 November 1950)",
            "url": "https://www.vatican.va/content/pius-xii/en/apost_constitutions/documents/hf_p-xii_apc_19501101_munificentissimus-deus.html",
            "note": "The definition of the Assumption, on vatican.va."
          },
          {
            "title": "OCA: The Dormition of Our Most Holy Lady the Mother of God and Ever-Virgin Mary",
            "url": "https://www.oca.org/saints/lives/2026/08/15/102302-the-dormition-of-our-most-holy-lady-the-mother-of-god-and-ever-v",
            "note": "The Orthodox feast and its tradition."
          }
        ]
      ],
      [
        "Scholasticism: Anselm, Aquinas and the method",
        [
          {
            "title": "Leo XIII, Aeterni Patris (1879)",
            "url": "https://www.vatican.va/content/leo-xiii/en/encyclicals/documents/hf_l-xiii_enc_04081879_aeterni-patris.html",
            "note": "The encyclical that made Aquinas the model of Catholic theology."
          },
          {
            "title": "St John of Damascus, Exact Exposition of the Orthodox Faith, Book IV (NPNF 2/9)",
            "url": "https://www.newadvent.org/fathers/33044.htm",
            "note": "Public domain, New Advent. The Eastern systematic summary Peter Lombard used."
          }
        ]
      ],
      [
        "The Orthodox critique of scholasticism, and the Orthodox who read Aquinas",
        [
          {
            "title": "Fr Georges Florovsky, Ways of Russian Theology",
            "note": "Printed book (Collected Works vols 5–6). The 'Western captivity' of Orthodox theology."
          },
          {
            "title": "Marcus Plested, Orthodox Readings of Aquinas",
            "note": "Printed book (Oxford, 2012). Kydones, Scholarios and the Byzantine Thomists."
          }
        ]
      ],
      [
        "Satisfaction and merit: Anselm's atonement and the Orthodox view",
        [
          {
            "title": "St Anselm, Cur Deus Homo (Fordham Medieval Sourcebook)",
            "url": "https://sourcebooks.web.fordham.edu/basis/anselm-curdeus.asp",
            "note": "Public-domain translation of Anselm's own argument."
          },
          {
            "title": "Metropolitan Antony Khrapovitsky, The Dogma of Redemption",
            "note": "Printed (1917; English translations exist). The Orthodox critique of juridical theories."
          }
        ]
      ],
      [
        "The sacraments: seven, valid, and ex opere operato",
        [
          {
            "title": "Council of Trent, Session VII: on the sacraments, tr. J. Waterworth (1848)",
            "url": "https://history.hanover.edu/texts/trent/ct07.html",
            "note": "Hanover Historical Texts. Canons on the seven sacraments and ex opere operato."
          },
          {
            "title": "Fr George Dragas, The Manner of Reception of Roman Catholic Converts into the Orthodox Church (PDF, Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/The-Manner-of-Reception-of-Roman-Catholic-Converts-into-the-Orthodox-Church-Fr-George-Dragas.pdf",
            "note": "History of the decrees of 1484, 1755 and after, and the debate over akriveia and oikonomia."
          },
          {
            "title": "Strictness and Economy (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/strictness.aspx",
            "note": "The strict view of receiving converts."
          }
        ]
      ],
      [
        "Baptism, chrismation and communion: why the order differs",
        [
          {
            "title": "The Didache, chapter 7 (ANF 7)",
            "url": "https://www.newadvent.org/fathers/0714.htm",
            "note": "Public domain, New Advent. Immersion, and pouring when water is lacking."
          },
          {
            "title": "St Cyprian, On the Lapsed (ANF 5)",
            "url": "https://www.newadvent.org/fathers/050703.htm",
            "note": "Public domain, New Advent. The account of a small child given the chalice."
          },
          {
            "title": "Against Baptism by Pouring (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/pouring.aspx",
            "note": "The Orthodox case for immersion."
          }
        ]
      ],
      [
        "The Eucharist: transubstantiation and the epiclesis",
        [
          {
            "title": "Council of Trent, Session XIII: Decree on the Eucharist, tr. J. Waterworth (1848)",
            "url": "https://history.hanover.edu/texts/trent/ct13.html",
            "note": "Hanover Historical Texts. The definition of transubstantiation."
          },
          {
            "title": "St John of Damascus, Exact Exposition of the Orthodox Faith 4.13 (NPNF 2/9)",
            "url": "https://www.newadvent.org/fathers/33044.htm",
            "note": "Public domain, New Advent. The change of the gifts by the Holy Spirit."
          },
          {
            "title": "St Nicholas Cabasilas, A Commentary on the Divine Liturgy, tr. J. M. Hussey and P. A. McNulty",
            "note": "Printed book (SPCK, 1960). Chapters 29–30 defend the epiclesis."
          }
        ]
      ],
      [
        "The Unia: the Union of Brest (1595–96) and the Eastern Catholic Churches",
        [
          {
            "title": "Vatican II, Orientalium Ecclesiarum (1964)",
            "url": "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_orientalium-ecclesiarum_en.html",
            "note": "Rome's decree on the Eastern Catholic churches."
          },
          {
            "title": "Borys Gudziak, Crisis and Reform: The Kyivan Metropolitanate, the Patriarchate of Constantinople, and the Genesis of the Union of Brest",
            "note": "Printed book (Harvard, 1998), by a Greek Catholic historian and bishop."
          }
        ]
      ],
      [
        "The Unia from both sides: Lviv 1946, Balamand 1993 and Ukraine",
        [
          {
            "title": "The Balamand Union (PDF, Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/Balamand.pdf",
            "note": "The strict Orthodox critique of the Balamand statement."
          },
          {
            "title": "Joint Commission dialogue documents (Dicastery for Promoting Christian Unity)",
            "url": "https://www.christianunity.va/content/unitacristiani/en/dialoghi/sezione-orientale/chiese-ortodosse-di-tradizione-bizantina/commissione-mista-internazionale-per-il-dialogo-teologico-tra-la/documenti-di-dialogo.html",
            "note": "The Catholic side's list of the commission's texts, including Balamand (1993)."
          }
        ]
      ],
      [
        "Vatican II and the lifting of the anathemas (1965)",
        [
          {
            "title": "Vatican II, Unitatis Redintegratio (1964)",
            "url": "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_unitatis-redintegratio_en.html",
            "note": "The decree on ecumenism; chapter 3 on the Eastern churches."
          },
          {
            "title": "Paul VI and Athenagoras I, Common Declaration (7 December 1965)",
            "url": "https://www.vatican.va/content/paul-vi/en/speeches/1965/documents/hf_p-vi_spe_19651207_common-declaration.html",
            "note": "The lifting of the anathemas of 1054."
          },
          {
            "title": "St Justin Popović, The Orthodox Church and Ecumenism",
            "note": "Printed book (1974; English tr. 2000). The strongest Orthodox case against ecumenism."
          }
        ]
      ],
      [
        "The dialogue today: Ravenna, Chieti, Alexandria and Nicaea 2025, as of November 2026",
        [
          {
            "title": "Joint Commission plenary sessions (Dicastery for Promoting Christian Unity)",
            "url": "https://www.christianunity.va/content/unitacristiani/en/dialoghi/sezione-orientale/chiese-ortodosse-di-tradizione-bizantina/commissione-mista-internazionale-per-il-dialogo-teologico-tra-la/sessioni-plenarie.html",
            "note": "The commission's plenaries from 1980 to Alexandria 2023."
          },
          {
            "title": "Joint Declaration of Pope Leo XIV and Patriarch Bartholomew (29 November 2025)",
            "url": "https://www.vatican.va/content/leo-xiv/en/travels/2025/documents/20251129-dichiarazione-congiunta.html",
            "note": "Signed at the Phanar after the prayer at Nicaea."
          },
          {
            "title": "Coordinating Committee of the International Catholic–Orthodox Dialogue (June 2026)",
            "url": "https://www.christianunity.va/content/unitacristiani/en/news/2026/2026-06-19-comitato-di-coordinamento-del-dialogo-internazionale-.html",
            "note": "The Pannonhalma meeting on the draft about infallibility."
          }
        ]
      ],
      [
        "What a Catholic says back: the strongest replies",
        [
          {
            "title": "John Henry Newman, An Essay on the Development of Christian Doctrine (Newman Reader)",
            "url": "https://www.newmanreader.org/works/development/",
            "note": "Public domain. The Catholic case for development."
          },
          {
            "title": "John Paul II, Ut Unum Sint (1995)",
            "url": "https://www.vatican.va/content/john-paul-ii/en/encyclicals/documents/hf_jp-ii_enc_25051995_ut-unum-sint.html",
            "note": "The invitation to rethink the exercise of the papacy."
          },
          {
            "title": "The Bishop of Rome (Dicastery for Promoting Christian Unity, 2024)",
            "url": "https://www.christianunity.va/content/unitacristiani/en/documenti/altri-testi/the-bishop-of-rome.html",
            "note": "The study document gathering responses to Ut Unum Sint."
          }
        ]
      ],
      [
        "Looking back: the questions since the schism",
        [
          {
            "title": "The Patriarchal Encyclical of 1895 (Fordham Sourcebook)",
            "url": "https://sourcebooks.web.fordham.edu/mod/1895orthodoxencyclical.asp",
            "note": "The Orthodox list of post-schism innovations, read as a review of the stage."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book. Chapters on the Orthodox and the West, by a moderate Orthodox voice."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 6 · The Reformation",
    "lessons": [
      [
        "Context: the Reformation, and why the Orthodox answer it differently",
        [
          {
            "title": "The Book of Concord (Triglot Concordia, 1921), BookOfConcord.org",
            "url": "https://bookofconcord.org/augsburg-confession/",
            "note": "The Lutheran confessions in the public-domain Triglot translation."
          },
          {
            "title": "The Three Answers of Patriarch Jeremiah II (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/jeremiah.aspx",
            "note": "The first Orthodox answer to the Reformation, in excerpt."
          }
        ]
      ],
      [
        "Luther and the Ninety-five Theses (1517)",
        [
          {
            "title": "Martin Luther, Disputation on the Power and Efficacy of Indulgences, tr. Spaeth, Reed, Jacobs et al. (1915), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/274",
            "note": "Public domain. The text quoted in the lesson."
          },
          {
            "title": "Catholic Encyclopedia (1910): Martin Luther (New Advent)",
            "url": "https://www.newadvent.org/cathen/09438b.htm",
            "note": "A Catholic account of his life from 1910, read as a witness from the other side."
          }
        ]
      ],
      [
        "Sola scriptura: the Protestant case",
        [
          {
            "title": "The Westminster Confession of Faith, chapter 1: Of the Holy Scripture (CCEL)",
            "url": "https://www.ccel.org/ccel/anonymous/westminster3.i.i.html",
            "note": "Public domain. Quoted in the lesson."
          },
          {
            "title": "The Thirty-Nine Articles (Anglicans Online)",
            "url": "https://anglicansonline.org/basics/thirty-nine_articles.html",
            "note": "Articles 6, 20 and 21 on Scripture and councils."
          }
        ]
      ],
      [
        "Scripture in the Church: the Orthodox answer to sola scriptura",
        [
          {
            "title": "St Irenaeus, Against Heresies 1.8 (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0103108.htm",
            "note": "Public domain, New Advent. The mosaic of the king."
          },
          {
            "title": "St Vincent of Lérins, Commonitorium (NPNF 2/11)",
            "url": "https://www.newadvent.org/fathers/3506.htm",
            "note": "Public domain, New Advent. Chapter 2: why tradition is needed alongside Scripture."
          },
          {
            "title": "St Athanasius, Festal Letter 39 (367) (NPNF 2/4)",
            "url": "https://www.newadvent.org/fathers/2806039.htm",
            "note": "Public domain, New Advent. The first list of the 27 New Testament books."
          }
        ]
      ],
      [
        "The canon: the deuterocanonical books and the Protestant Old Testament",
        [
          {
            "title": "The Confession of Dositheus, Question 3, tr. Robertson (1899)",
            "url": "https://www.catholicity.elcore.net/ConfessionOfDositheus.html",
            "note": "Public domain. The Synod of Jerusalem on the deuterocanonical books; quoted in the lesson."
          },
          {
            "title": "The Westminster Confession of Faith, chapter 1 (CCEL)",
            "url": "https://www.ccel.org/ccel/anonymous/westminster3.i.i.html",
            "note": "Section 3 on the Apocrypha."
          }
        ]
      ],
      [
        "Sola fide: justification in Luther and the Augsburg Confession",
        [
          {
            "title": "The Augsburg Confession, Article IV: Of Justification (Triglot, 1921)",
            "url": "https://bookofconcord.org/augsburg-confession/article-iv/",
            "note": "BookOfConcord.org, public domain."
          },
          {
            "title": "Council of Trent, Session VI: Decree on Justification, tr. J. Waterworth (1848)",
            "url": "https://history.hanover.edu/texts/trent/ct06.html",
            "note": "Rome's answer; canon 9 quoted in the lesson."
          }
        ]
      ],
      [
        "Justification and theosis: the Orthodox answer to sola fide",
        [
          {
            "title": "Justification by Faith Alone? The Reply of Patriarch Jeremiah II (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/inquirers/faithalone.aspx",
            "note": "Jeremias II on faith and works."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1 (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/eternal-life",
            "note": "The OCA's catechism; salvation, judgement and life in God."
          },
          {
            "title": "Tuomo Mannermaa, Christ Present in Faith: Luther's View of Justification",
            "note": "Printed book (Fortress, 2005). The Finnish Lutheran reading of Luther close to theosis."
          }
        ]
      ],
      [
        "Reading: the Augsburg Confession, Article IV (1530)",
        [
          {
            "title": "The Augsburg Confession, Article IV: Of Justification (Triglot Concordia, 1921)",
            "url": "https://bookofconcord.org/augsburg-confession/article-iv/",
            "note": "BookOfConcord.org, public domain. The text read in this lesson."
          }
        ]
      ],
      [
        "Reading: the Confession of Dositheus, Decree XIII (1672)",
        [
          {
            "title": "The Confession of Dositheus, from The Acts and Decrees of the Synod of Jerusalem, tr. J. N. W. B. Robertson (1899)",
            "url": "https://www.catholicity.elcore.net/ConfessionOfDositheus.html",
            "note": "Public domain. The text read in this lesson."
          }
        ]
      ],
      [
        "The bondage of the will: Luther against Erasmus (1525)",
        [
          {
            "title": "Martin Luther, The Bondage of the Will (CCEL)",
            "url": "https://www.ccel.org/ccel/luther/bondage.html",
            "note": "Public-domain translation of De servo arbitrio."
          },
          {
            "title": "Formula of Concord, Solid Declaration, Article II: Free Will (Triglot, 1921)",
            "url": "https://bookofconcord.org/formula-of-concord-solid-declaration/article-ii/",
            "note": "The Lutheran confessional statement."
          },
          {
            "title": "St John Cassian, Conference 13: On the Protection of God (NPNF 2/11)",
            "url": "https://www.newadvent.org/fathers/350813.htm",
            "note": "Public domain, New Advent. Grace and the free will."
          }
        ]
      ],
      [
        "The Lutheran Eucharist: real presence without transubstantiation",
        [
          {
            "title": "The Augsburg Confession, Article X: Of the Lord's Supper (Triglot, 1921)",
            "url": "https://bookofconcord.org/augsburg-confession/article-x/",
            "note": "BookOfConcord.org."
          },
          {
            "title": "Formula of Concord, Solid Declaration, Article VII: The Holy Supper (Triglot, 1921)",
            "url": "https://bookofconcord.org/formula-of-concord-solid-declaration/article-vii/",
            "note": "\"In, with and under\"."
          }
        ]
      ],
      [
        "Zwingli and the memorial supper: Marburg (1529)",
        [
          {
            "title": "St Ignatius of Antioch, Epistle to the Smyrnaeans (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0109.htm",
            "note": "Public domain, New Advent. Chapter 7 on the Eucharist as Christ's flesh."
          },
          {
            "title": "St Justin Martyr, First Apology (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Public domain, New Advent. Chapters 65–67 on the Eucharist."
          }
        ]
      ],
      [
        "Calvin and the Institutes",
        [
          {
            "title": "John Calvin, Institutes of the Christian Religion, Book I chapter 11, tr. Henry Beveridge (CCEL)",
            "url": "https://ccel.org/ccel/calvin/institutes/institutes.iii.xii.html",
            "note": "Public domain. Calvin against images."
          },
          {
            "title": "John Calvin, Institutes, Book II chapter 1: original sin, tr. Beveridge (CCEL)",
            "url": "https://ccel.org/ccel/calvin/institutes/institutes.iv.ii.html",
            "note": "Public domain."
          }
        ]
      ],
      [
        "Predestination: Calvin, Dort and Westminster",
        [
          {
            "title": "John Calvin, Institutes, Book III chapter 21, tr. Henry Beveridge (1845), CCEL",
            "url": "https://ccel.org/ccel/calvin/institutes/institutes.v.xxii.html",
            "note": "Public domain. Section 5 quoted in the lesson."
          },
          {
            "title": "The Westminster Confession of Faith, chapter 3: Of God's Eternal Decree (CCEL)",
            "url": "https://www.ccel.org/ccel/anonymous/westminster3.i.iii.html",
            "note": "Public domain. Sections 3 and 5 quoted."
          }
        ]
      ],
      [
        "Predestination: the Orthodox answer",
        [
          {
            "title": "On Predestination (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/inquirers/predestination.aspx",
            "note": "The Orthodox answer to the Reformed doctrine."
          },
          {
            "title": "The Confession of Dositheus, Decree 3, tr. Robertson (1899)",
            "url": "https://www.catholicity.elcore.net/ConfessionOfDositheus.html",
            "note": "Public domain. Quoted in the lesson."
          }
        ]
      ],
      [
        "The Anabaptists: believers' baptism, peace and persecution",
        [
          {
            "title": "St Basil, Letters (NPNF 2/8), Letter 188 and the canonical letters",
            "url": "https://www.newadvent.org/fathers/3202.htm",
            "note": "Public domain, New Advent. Canon 13 on those who kill in war is in Letter 188."
          },
          {
            "title": "Thieleman J. van Braght, Martyrs Mirror (1660)",
            "note": "Printed book (Herald Press). The Anabaptists' own record of their martyrs."
          }
        ]
      ],
      [
        "Icons, saints and the Reformed iconoclasm",
        [
          {
            "title": "St John of Damascus, Apologia against those who decry holy images (Fordham Medieval Sourcebook)",
            "url": "https://sourcebooks.web.fordham.edu/basis/johndamascus-images.asp",
            "note": "The defence of icons from the Incarnation."
          },
          {
            "title": "Heidelberg Catechism (CCEL)",
            "url": "https://www.ccel.org/ccel/anonymous/heidelberg.html",
            "note": "Questions 96–98: the Reformed case against images."
          },
          {
            "title": "St Basil, On the Holy Spirit (NPNF 2/8)",
            "url": "https://www.newadvent.org/fathers/3203.htm",
            "note": "Chapter 18.45: the honour passes to the prototype."
          }
        ]
      ],
      [
        "The priesthood of all believers and the ordained ministry",
        [
          {
            "title": "Martin Luther, To the Christian Nobility of the German Nation (1520), Fordham Modern History Sourcebook",
            "url": "https://sourcebooks.web.fordham.edu/mod/luther-nobility.asp",
            "note": "Luther's own statement of the priesthood of all believers."
          },
          {
            "title": "St Clement of Rome, First Letter to the Corinthians (ANF 9)",
            "url": "https://www.newadvent.org/fathers/1010.htm",
            "note": "Public domain, New Advent. Chapters 42–44 on the apostolic succession."
          }
        ]
      ],
      [
        "Patriarch Jeremias II and the Tübingen theologians (1573–1581)",
        [
          {
            "title": "The Three Answers of Patriarch Jeremiah II (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/jeremiah.aspx",
            "note": "Excerpts from the correspondence."
          },
          {
            "title": "George Mastrantonis, Augsburg and Constantinople: The Correspondence between the Tübingen Theologians and Patriarch Jeremiah II",
            "note": "Printed book (Holy Cross Orthodox Press, 1982). The full correspondence in English."
          }
        ]
      ],
      [
        "Cyril Lucaris and his Confession (1629)",
        [
          {
            "title": "The Acts and Decrees of the Synod of Jerusalem, tr. Robertson (1899), chapter 6 with introduction",
            "url": "https://www.catholicity.elcore.net/ConfessionOfDositheus.html",
            "note": "The Synod's answer to the Confession, with notes on its claim of forgery."
          },
          {
            "title": "Steven Runciman, The Great Church in Captivity",
            "note": "Printed book (Cambridge, 1968). The standard history of Lucaris and his age."
          }
        ]
      ],
      [
        "The councils against Lucaris: Mogila, Iasi (1642) and Jerusalem (1672)",
        [
          {
            "title": "The Confession of Dositheus, tr. J. N. W. B. Robertson (1899)",
            "url": "https://www.catholicity.elcore.net/ConfessionOfDositheus.html",
            "note": "Public domain. The eighteen decrees, quoted in the lesson."
          },
          {
            "title": "Fr James Thornton, The Synod of Iasi 1642 and the Synod of Jerusalem 1672 (PDF, Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/general/Synod-of-Iasi-1642-and-the-Synod-of-Jerusalem-1672-The-Oecumenical-Synods-of-the-Orthodox-Church-Fr-James-Thornton.pdf",
            "note": "The case for the councils' full authority."
          }
        ]
      ],
      [
        "The Church of England: Henry VIII, Cranmer and the Thirty-Nine Articles",
        [
          {
            "title": "The Thirty-Nine Articles (Anglicans Online)",
            "url": "https://anglicansonline.org/basics/thirty-nine_articles.html",
            "note": "The text quoted in the lesson (the 1801 American text, with the original Article 21 given)."
          },
          {
            "title": "Diarmaid MacCulloch, Thomas Cranmer: A Life",
            "note": "Printed book (Yale, 1996)."
          }
        ]
      ],
      [
        "The Nonjurors and the Eastern patriarchs (1716–1725)",
        [
          {
            "title": "Project Canterbury: Resources on the Nonjurors",
            "url": "https://anglicanhistory.org/nonjurors/",
            "note": "The Nonjurors' own writings."
          },
          {
            "title": "George Williams, The Orthodox Church of the East in the Eighteenth Century (1868)",
            "note": "Printed book (public domain). The full correspondence between the Nonjurors and the Eastern patriarchs."
          }
        ]
      ],
      [
        "Anglicans and Orthodox since: orders, dialogue and the break over ordination",
        [
          {
            "title": "Project Canterbury: Anglicanism and Orthodoxy",
            "url": "https://anglicanhistory.org/orthodoxy/",
            "note": "Documents of Anglican–Orthodox relations, 18th–20th centuries."
          },
          {
            "title": "Metropolitan Antony Khrapovitsky, Why Anglican Clergy Are Not Reordained (1927), Project Canterbury",
            "url": "https://anglicanhistory.org/orthodoxy/khrapovitsky_orders1927.html",
            "note": "A Russian Orthodox view of Anglican orders."
          }
        ]
      ],
      [
        "What a Protestant says back: the strongest replies",
        [
          {
            "title": "Clark Carlton, The Way: What Every Protestant Should Know about the Orthodox Church",
            "note": "Printed book (Regina Orthodox Press, 1997), by a convert."
          },
          {
            "title": "Daniel B. Clendenin, Eastern Orthodox Christianity: A Western Perspective",
            "note": "Printed book (Baker). An evangelical's fair account and critique of Orthodoxy, read as their best reply."
          }
        ]
      ],
      [
        "Looking back: the Reformation and the Orthodox answer",
        [
          {
            "title": "The Confession of Dositheus, tr. Robertson (1899)",
            "url": "https://www.catholicity.elcore.net/ConfessionOfDositheus.html",
            "note": "The Orthodox answer to the Reformation, decree by decree."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book. Chapter on the Orthodox and the Reformation."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 7 · The Reformation's heirs",
    "lessons": [
      [
        "Context: the heirs of the Reformation and the world they made",
        [
          {
            "title": "Allan Anderson, An Introduction to Pentecostalism",
            "note": "Printed book (Cambridge, 2nd ed. 2014). A sympathetic scholar's account of the global movement."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1 (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/eternal-life",
            "note": "The OCA's catechism, for the Orthodox side of the questions in this stage."
          }
        ]
      ],
      [
        "Baptists and believers' baptism: the case",
        [
          {
            "title": "The Second London Baptist Confession (1689), chapter 29: Of Baptism",
            "url": "https://www.the1689confession.com/1689/chapter-29",
            "note": "The Baptists' own confession."
          },
          {
            "title": "Thomas Helwys, A Short Declaration of the Mystery of Iniquity (1612)",
            "note": "Printed (Mercer, 1998). The first English Baptist plea for religious liberty."
          }
        ]
      ],
      [
        "Infant baptism and baptismal regeneration: the Orthodox answer",
        [
          {
            "title": "St Irenaeus, Against Heresies 2.22 (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0103222.htm",
            "note": "Public domain, New Advent. Section 4: Christ came to save infants, children and adults."
          },
          {
            "title": "St Cyprian, Epistle 58, to Fidus, on the baptism of infants (ANF 5)",
            "url": "https://www.newadvent.org/fathers/050658.htm",
            "note": "Public domain, New Advent. The council of 66 bishops."
          },
          {
            "title": "Tertullian, On Baptism (ANF 3)",
            "url": "https://www.newadvent.org/fathers/0321.htm",
            "note": "Public domain, New Advent. Chapter 18: his advice to delay, read as the Baptists' best patristic witness."
          }
        ]
      ],
      [
        "Reading: the Second London Baptist Confession on baptism (1689)",
        [
          {
            "title": "The Second London Baptist Confession (1689), chapter 29: Of Baptism",
            "url": "https://www.the1689confession.com/1689/chapter-29",
            "note": "The text read in this lesson (modern spelling)."
          }
        ]
      ],
      [
        "Reading: St Gregory the Theologian on baptising children (Oration 40)",
        [
          {
            "title": "St Gregory of Nazianzus, Oration 40, On Holy Baptism, tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310240.htm",
            "note": "Public domain, New Advent. Sections 17 and 28 are read in this lesson."
          }
        ]
      ],
      [
        "John Wesley and Methodism",
        [
          {
            "title": "The Journal of John Wesley: \"I Felt My Heart Strangely Warmed\" (CCEL)",
            "url": "https://ccel.org/ccel/wesley/journal/journal.vi.ii.xvi.html",
            "note": "Public domain. Wesley's own account of 24 May 1738, quoted in the lesson."
          },
          {
            "title": "Ted A. Campbell, John Wesley and Christian Antiquity",
            "note": "Printed book (Kingswood, 1991). Wesley's reading of the Fathers, Macarius and Ephrem."
          }
        ]
      ],
      [
        "Christian perfection and theosis: Wesley and the Fathers",
        [
          {
            "title": "John Wesley, A Plain Account of Christian Perfection (CCEL)",
            "url": "https://www.ccel.org/ccel/wesley/perfection.html",
            "note": "Public domain. Wesley's own summary of the doctrine."
          },
          {
            "title": "St Gregory of Nyssa, The Life of Moses, tr. Malherbe and Ferguson",
            "note": "Printed book (Paulist, 1978). Perfection as endless progress."
          }
        ]
      ],
      [
        "The holiness movement and the road to Pentecost",
        [
          {
            "title": "St Seraphim of Sarov's Conversation with Nicholas Motovilov (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/praxis/wonderful.aspx",
            "note": "The acquisition of the Holy Spirit as the aim of the Christian life."
          },
          {
            "title": "Vinson Synan, The Holiness–Pentecostal Tradition",
            "note": "Printed book (Eerdmans, 2nd ed. 1997), by a Pentecostal historian."
          }
        ]
      ],
      [
        "Pentecostals: Azusa Street and the baptism in the Spirit",
        [
          {
            "title": "Cecil M. Robeck Jr, The Azusa Street Mission and Revival",
            "note": "Printed book (Thomas Nelson, 2006), by a Pentecostal historian."
          },
          {
            "title": "OCA: Repose of Venerable Seraphim, Wonderworker of Sarov",
            "url": "https://www.oca.org/saints/lives/2026/01/02/100008-repose-of-venerable-seraphim-wonderworker-of-sarov",
            "note": "The Orthodox saint of the experience of the Spirit."
          }
        ]
      ],
      [
        "Tongues, prophecy and healing: the Orthodox answer to the charismatic",
        [
          {
            "title": "St John Chrysostom, Homily 29 on First Corinthians (NPNF 1/12, 1889)",
            "url": "https://www.newadvent.org/fathers/220129.htm",
            "note": "Public domain, New Advent. Quoted in the lesson."
          },
          {
            "title": "The Charismatic Movement and Orthodoxy (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/inquirers/charmov.aspx",
            "note": "The strict Orthodox critique, after Fr Seraphim Rose."
          },
          {
            "title": "Fr Seraphim Rose, Orthodoxy and the Religion of the Future",
            "note": "Printed book (St Herman of Alaska Brotherhood, 1975). The chapter on the charismatic revival."
          }
        ]
      ],
      [
        "Evangelicals: conversion, the Bible, the cross, mission",
        [
          {
            "title": "David Bebbington, Evangelicalism in Modern Britain: A History from the 1730s to the 1980s",
            "note": "Printed book (1989). The source of the quadrilateral."
          },
          {
            "title": "Bradley Nassif and others, Three Views on Eastern Orthodoxy and Evangelicalism",
            "note": "Printed book (Zondervan, 2004). Orthodox and evangelical writers answer each other."
          }
        ]
      ],
      [
        "\"A personal relationship with Jesus\": the evangelical and the Orthodox",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Spirituality (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality",
            "note": "Prayer and the life in Christ in Orthodox teaching."
          },
          {
            "title": "St Cyprian, On the Unity of the Church (ANF 5)",
            "url": "https://www.newadvent.org/fathers/050701.htm",
            "note": "Public domain, New Advent. Chapter 6: the Church as mother."
          }
        ]
      ],
      [
        "The prosperity gospel: Word of Faith",
        [
          {
            "title": "Kate Bowler, Blessed: A History of the American Prosperity Gospel",
            "note": "Printed book (Oxford, 2013). The standard history, fair to its subject."
          },
          {
            "title": "Kenneth E. Hagin, The Believer's Authority",
            "note": "Printed (Rhema). The Word of Faith teaching in its founder's words."
          }
        ]
      ],
      [
        "The prosperity gospel answered: the cross and poverty in the Fathers",
        [
          {
            "title": "OCA: Holy Wonderworkers and Unmercenaries Cosmas and Damian",
            "url": "https://www.oca.org/saints/lives/2026/11/01/103133-holy-wonderworkers-and-unmercenaries-cosmas-and-damian-of-mesopo",
            "note": "The Unmercenary Healers, who healed without payment."
          },
          {
            "title": "St John Chrysostom, On Wealth and Poverty, tr. Catharine P. Roth",
            "note": "Printed book (SVS Press, 1984). The sermons on Lazarus."
          }
        ]
      ],
      [
        "African Independent churches: Kimbangu, Shembe and the Aladura",
        [
          {
            "title": "Dictionary of African Christian Biography: Kimbangu, Simon",
            "url": "https://dacb.org/stories/democratic-republic-of-congo/kimbangu-simon/",
            "note": "His life and church."
          },
          {
            "title": "Dictionary of African Christian Biography: Spartas, Christopher Reuben",
            "url": "https://dacb.org/stories/uganda/spartas-reuben/",
            "note": "The Ugandan founder who brought his church to Orthodoxy."
          },
          {
            "title": "Bengt Sundkler, Bantu Prophets in South Africa",
            "note": "Printed book (1948; 2nd ed. 1961). The classic study of the Ethiopian and Zionist churches."
          }
        ]
      ],
      [
        "The Zionist and Apostolic churches of southern Africa: the ZCC and the Vapostori",
        [
          {
            "title": "Clive M. Dillon-Malone, The Korsten Basketmakers: A Study of the Masowe Apostles",
            "note": "Printed book (Manchester University Press, 1978)."
          },
          {
            "title": "Allan Anderson, African Reformation: African Initiated Christianity in the 20th Century",
            "note": "Printed book (Africa World Press, 2001), on the Zionist and Apostolic churches."
          }
        ]
      ],
      [
        "Liberal Protestantism: Schleiermacher, Harnack, Bultmann",
        [
          {
            "title": "Adolf von Harnack, History of Dogma, vol. 1 (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/19612",
            "note": "Public-domain English translation. The Hellenisation thesis in its own words."
          },
          {
            "title": "Friedrich Schleiermacher, On Religion: Speeches to its Cultured Despisers, tr. Richard Crouter",
            "note": "Printed book (Cambridge, 1996)."
          }
        ]
      ],
      [
        "Liberal Protestantism answered: the faith once delivered",
        [
          {
            "title": "St Vincent of Lérins, Commonitorium (NPNF 2/11)",
            "url": "https://www.newadvent.org/fathers/3506.htm",
            "note": "Public domain, New Advent. What has been believed everywhere, always, by all."
          },
          {
            "title": "Fr Georges Florovsky, Bible, Church, Tradition: An Eastern Orthodox View",
            "note": "Printed (Collected Works vol. 1). Includes his answer on Christian Hellenism."
          },
          {
            "title": "J. Gresham Machen, Christianity and Liberalism",
            "note": "Printed book (1923). The Protestant case that liberalism is another religion."
          }
        ]
      ],
      [
        "The Old Catholics: Utrecht, Döllinger and the Bonn conferences",
        [
          {
            "title": "Union of Utrecht of the Old Catholic Churches (official site)",
            "url": "https://www.utrechter-union.org/",
            "note": "The Old Catholics' own site, with the Declaration of Utrecht (1889)."
          },
          {
            "title": "Urs von Arx (ed.), Koinonia auf altkirchlicher Basis: the Orthodox–Old Catholic dialogue texts",
            "note": "Printed (1989). The agreed texts of 1975–1987."
          }
        ]
      ],
      [
        "Orthodox converts from Protestantism: the Evangelical Orthodox and the reception question",
        [
          {
            "title": "Peter E. Gillquist, Becoming Orthodox",
            "note": "Printed book (Conciliar Press, 1989). The Evangelical Orthodox story."
          },
          {
            "title": "Fr George Dragas, The Manner of Reception (PDF, Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/The-Manner-of-Reception-of-Roman-Catholic-Converts-into-the-Orthodox-Church-Fr-George-Dragas.pdf",
            "note": "The history of the canons and decrees on receiving the heterodox."
          },
          {
            "title": "Strictness and Economy (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/ecumenism/strictness.aspx",
            "note": "The case for receiving by baptism."
          }
        ]
      ],
      [
        "The Western Rite: Overbeck, the Antiochians and ROCOR, where Orthodox differ",
        [
          {
            "title": "J. J. Overbeck, Catholic Orthodoxy and Anglo-Catholicism (1866), Project Canterbury",
            "url": "http://anglicanhistory.org/orthodoxy/overbeck/catholic1866.html",
            "note": "Overbeck's own case for a Western Orthodox Church."
          },
          {
            "title": "Project Canterbury: Anglicanism and Orthodoxy",
            "url": "https://anglicanhistory.org/orthodoxy/",
            "note": "Includes papers on the Western Rite and the 1904 Russian observations on the Prayer Book."
          }
        ]
      ],
      [
        "Looking back: the Reformation's heirs",
        [
          {
            "title": "Clark Carlton, The Way: What Every Protestant Should Know about the Orthodox Church",
            "note": "Printed book (Regina Orthodox Press, 1997)."
          },
          {
            "title": "St Seraphim of Sarov's Conversation with Nicholas Motovilov (Orthodox Christian Information Center)",
            "url": "https://www.orthodoxinfo.com/praxis/wonderful.aspx",
            "note": "The Orthodox answer to the hunger for the Spirit."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 8 · The new movements",
    "lessons": [
      [
        "Context: the new movements, and why they are answered apart",
        [
          {
            "title": "Fr Andrew Stephen Damick, Orthodoxy and Heterodoxy",
            "note": "Printed book. An Antiochian priest's survey of the other faiths, with chapters on the Witnesses, Latter-day Saints, Adventists, Christian Science and Oneness Pentecostals."
          },
          {
            "title": "OCA Questions & Answers: Jehovah's Witnesses",
            "url": "https://www.oca.org/questions/nonchristiangroups/jehovahs-witnesses",
            "note": "The Orthodox Church in America's pastoral answer: meet them with warmth, not argument for its own sake."
          }
        ]
      ],
      [
        "The Watch Tower: Russell, Rutherford and the Witnesses' story",
        [
          {
            "title": "Reasoning From the Scriptures: Jehovah's Witnesses (jw.org)",
            "url": "https://www.jw.org/en/library/books/Reasoning-From-the-Scriptures/Jehovahs-Witnesses/",
            "note": "Their own account of who they are and what they believe."
          },
          {
            "title": "2025 Service Year Report of Jehovah's Witnesses Worldwide: Grand Totals (jw.org)",
            "url": "https://www.jw.org/en/library/books/2025-Service-Year-Report-of-Jehovahs-Witnesses-Worldwide/2025-Grand-Totals/",
            "note": "The figures given in the lesson: peak publishers, Memorial attendance and partakers."
          }
        ]
      ],
      [
        "Jehovah's Witnesses on Christ: Michael, worship and prayer",
        [
          {
            "title": "The Archangel Michael: Who Is He? (jw.org)",
            "url": "https://www.jw.org/en/bible-teachings/questions/archangel-michael/",
            "note": "Their own case that Michael is Jesus."
          },
          {
            "title": "Insight on the Scriptures: Jesus Christ (jw.org)",
            "url": "https://www.jw.org/en/library/books/Insight-on-the-Scriptures/Jesus-Christ/",
            "note": "Their reference work's article: the Son as God's first creation, honoured but not worshipped as God."
          },
          {
            "title": "St Gregory of Nazianzus, Fourth Theological Oration (Oration 30), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310230.htm",
            "note": "Public domain, New Advent. Gregory answers the Arian texts one by one."
          }
        ]
      ],
      [
        "John 1:1 and the New World Translation",
        [
          {
            "title": "John 1:1: Was the Word \"God\" or \"a god\"? (jw.org)",
            "url": "https://www.jw.org/en/library/magazines/wp20081101/was-the-word-god/",
            "note": "Their own defence of the New World Translation's rendering."
          },
          {
            "title": "St Irenaeus, Against Heresies, Book 3, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103311.htm",
            "note": "Public domain, New Advent. Chapter 11 quotes John 1:1 as plain proof of the Word's deity."
          }
        ]
      ],
      [
        "The Witnesses' hope: 1914, the 144,000 and the paradise earth",
        [
          {
            "title": "Jehovah's Witnesses: Proclaimers of God's Kingdom, \"The Great Crowd: to Live in Heaven? Or on Earth?\" (jw.org)",
            "url": "https://www.jw.org/en/library/books/Jehovahs-Witnesses-Proclaimers-of-Gods-Kingdom/Gaining-Accurate-Knowledge-of-Gods-Word-and-Applying-It/The-Great-Crowd-to-Live-in-Heaven-Or-on-Earth/",
            "note": "Their own history of the two hopes, including the revised dates."
          },
          {
            "title": "Reasoning From the Scriptures: Cross (jw.org)",
            "url": "https://www.jw.org/en/library/books/Reasoning-From-the-Scriptures/Cross/",
            "note": "Their case for the \"torture stake\"."
          },
          {
            "title": "St Justin Martyr, First Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Public domain, New Advent. Chapter 55 on the shape of the cross."
          }
        ]
      ],
      [
        "The Latter-day Saints: Joseph Smith and the Restoration",
        [
          {
            "title": "Gospel Topics Essays: First Vision Accounts (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/manual/gospel-topics-essays/first-vision-accounts?lang=eng",
            "note": "The Church's own account of the First Vision and its several tellings."
          },
          {
            "title": "2025 Statistical Report (Newsroom, churchofjesuschrist.org)",
            "url": "https://newsroom.churchofjesuschrist.org/article/2025-statistical-report",
            "note": "The membership and temple figures given in the lesson."
          },
          {
            "title": "The Articles of Faith (Pearl of Great Price)",
            "url": "https://www.churchofjesuschrist.org/study/scriptures/pgp/a-of-f/1?lang=eng",
            "note": "Joseph Smith's thirteen articles (1842); the eighth is quoted."
          }
        ]
      ],
      [
        "The Book of Mormon: its claims and the evidence",
        [
          {
            "title": "Gospel Topics Essays: Book of Mormon Translation (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/manual/gospel-topics-essays/book-of-mormon-translation?lang=eng",
            "note": "The Church's account of how the book came forth."
          },
          {
            "title": "Gospel Topics Essays: Book of Mormon and DNA Studies (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/manual/gospel-topics-essays/book-of-mormon-and-dna-studies?lang=eng",
            "note": "The Church's own reply on the genetic evidence."
          },
          {
            "title": "Hugh Nibley, An Approach to the Book of Mormon",
            "note": "Printed book. The best-known Latter-day Saint scholarly defence of the book's ancient setting."
          }
        ]
      ],
      [
        "The Great Apostasy: did the Church fall?",
        [
          {
            "title": "Gospel Topics: Apostasy (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/manual/gospel-topics/apostasy?lang=eng",
            "note": "Their own statement of the Great Apostasy."
          },
          {
            "title": "St Irenaeus, Against Heresies 3.3, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103303.htm",
            "note": "Public domain, New Advent. The succession of bishops from the apostles, as the proof that the teaching was kept."
          },
          {
            "title": "St Ignatius of Antioch, Epistle to the Magnesians, tr. Roberts and Donaldson (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0105.htm",
            "note": "Public domain, New Advent. A Church with bishop, presbyters and deacons about 107."
          }
        ]
      ],
      [
        "Reading: Doctrine and Covenants 130 on the body of God",
        [
          {
            "title": "Doctrine and Covenants 130 (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/130?lang=eng",
            "note": "The text read in the lesson, verses 1–3 and 22."
          },
          {
            "title": "Doctrine and Covenants 132 (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/132?lang=eng",
            "note": "Verse 20, on the exalted becoming gods."
          }
        ]
      ],
      [
        "Exaltation and the plurality of gods: the Latter-day Saint doctrine of God",
        [
          {
            "title": "Gospel Topics Essays: Becoming Like God (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/manual/gospel-topics-essays/becoming-like-god?lang=eng",
            "note": "The Church's own statement of exaltation, which cites the Fathers on theosis."
          },
          {
            "title": "Doctrine and Covenants 93 (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/93?lang=eng",
            "note": "Verse 29: intelligence \"was not created or made\"."
          },
          {
            "title": "St Athanasius, On the Incarnation, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent. Chapter 54 is the text on theosis that Latter-day Saints quote; read in context, it is deification by grace."
          }
        ]
      ],
      [
        "Reading: St Gregory the Theologian on why God is not a body",
        [
          {
            "title": "St Gregory of Nazianzus, Second Theological Oration (Oration 28), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310228.htm",
            "note": "Public domain, New Advent. Sections 7–9 are read in the lesson."
          }
        ]
      ],
      [
        "The Seventh-day Adventists: Ellen White and 1844",
        [
          {
            "title": "Ellen G. White, The Great Controversy Between Christ and Satan (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/25833",
            "note": "Public domain. Her own account of 1844 and the heavenly sanctuary, in the chapters on the Millerite movement."
          }
        ]
      ],
      [
        "The Sabbath and the Lord's Day",
        [
          {
            "title": "St Ignatius of Antioch, Epistle to the Magnesians, tr. Roberts and Donaldson (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0105.htm",
            "note": "Public domain, New Advent. Chapter 9 on the Lord's Day."
          },
          {
            "title": "St Justin Martyr, First Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Public domain, New Advent. Chapter 67, the Sunday assembly."
          },
          {
            "title": "Ellen G. White, The Great Controversy (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/25833",
            "note": "Public domain. The Adventist case for the Sabbath and against Sunday in her own words."
          }
        ]
      ],
      [
        "Soul sleep and annihilation: what happens at death",
        [
          {
            "title": "Reasoning From the Scriptures: Soul (jw.org)",
            "url": "https://www.jw.org/en/library/books/Reasoning-From-the-Scriptures/Soul/",
            "note": "The Witnesses' case for the mortal soul."
          },
          {
            "title": "St John of Damascus, An Exposition of the Orthodox Faith, Book II, tr. S. D. F. Salmond (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33042.htm",
            "note": "Public domain, New Advent. Chapter 3: immortal \"not by nature but by grace\"."
          }
        ]
      ],
      [
        "Christian Science: Mary Baker Eddy and the unreality of matter",
        [
          {
            "title": "Mary Baker Eddy, Science and Health with Key to the Scriptures (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/3458",
            "note": "Public domain. Page 468, \"the scientific statement of being\", is quoted."
          },
          {
            "title": "What is Christian Science? (christianscience.com)",
            "url": "https://www.christianscience.com/what-is-christian-science",
            "note": "The church's own introduction."
          }
        ]
      ],
      [
        "Oneness Pentecostals: the modalists again",
        [
          {
            "title": "United Pentecostal Church International: Our Beliefs",
            "url": "https://www.upci.org/about/our-beliefs",
            "note": "The largest Oneness body's own statement."
          },
          {
            "title": "The Didache, tr. M. B. Riddle (ANF 7, 1886)",
            "url": "https://www.newadvent.org/fathers/0714.htm",
            "note": "Public domain, New Advent. Chapter 7, baptism in the threefold name."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Holy Trinity (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity",
            "note": "Free on oca.org. The Orthodox doctrine of the three persons."
          }
        ]
      ],
      [
        "At the door: what each will say, and what to answer",
        [
          {
            "title": "Moroni 10 (churchofjesuschrist.org)",
            "url": "https://www.churchofjesuschrist.org/study/scriptures/bofm/moro/10?lang=eng",
            "note": "Verse 4, the missionaries' invitation, quoted in the lesson."
          },
          {
            "title": "Fr Vladimir Berzonsky, The Orthodox Christian and the Heretic (OCA)",
            "url": "https://www.oca.org/reflections/berzonsky/the-orthodox-christian-and-the-heretic",
            "note": "An Orthodox priest on meeting Witnesses and Latter-day Saints at the door."
          },
          {
            "title": "Fr Andrew Stephen Damick, Orthodoxy and Heterodoxy",
            "note": "Printed book. An Antiochian priest's survey of the other faiths, with chapters on the Witnesses, Latter-day Saints, Adventists, Christian Science and Oneness Pentecostals."
          }
        ]
      ],
      [
        "Looking back: the new movements",
        [
          {
            "title": "Fr Andrew Stephen Damick, Orthodoxy and Heterodoxy",
            "note": "Printed book. An Antiochian priest's survey of the other faiths, with chapters on the Witnesses, Latter-day Saints, Adventists, Christian Science and Oneness Pentecostals."
          },
          {
            "title": "St Irenaeus, Against Heresies 3.3, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103303.htm",
            "note": "Public domain, New Advent. The second-century answer to every claim that the Church was lost."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 9 · Islam",
    "lessons": [
      [
        "Context: Islam and the Church's long conversation with it",
        [
          {
            "title": "Pew Research Center, How the Global Religious Landscape Changed From 2010 to 2020 (2025)",
            "url": "https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/",
            "note": "The figure of about 2 billion Muslims in 2020."
          },
          {
            "title": "The Qur'an, tr. Marmaduke Pickthall (1930), in Three Translations of the Koran side by side (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/16955",
            "note": "Public domain. Pickthall's translation, with Yusuf Ali and Shakir in parallel; the source of every Qur'an quotation in this stage."
          },
          {
            "title": "Sidney H. Griffith, The Church in the Shadow of the Mosque",
            "note": "Printed book. How Christians in the early Islamic world, Orthodox among them, explained their faith in Arabic."
          }
        ]
      ],
      [
        "Muhammad: his life as Muslims tell it",
        [
          {
            "title": "Qur'an 33:40 (quran.com)",
            "url": "https://quran.com/33/40",
            "note": "The Seal of the Prophets, with the Arabic and many translations."
          },
          {
            "title": "Ibn Ishaq, The Life of Muhammad, tr. A. Guillaume",
            "note": "Printed book. The earliest surviving biography of the Prophet, as edited by Ibn Hisham; the life Muslims receive."
          }
        ]
      ],
      [
        "The Qur'an: recitation, revelation and inimitability",
        [
          {
            "title": "The Qur'an, tr. Marmaduke Pickthall (1930), in Three Translations of the Koran side by side (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/16955",
            "note": "Public domain. Pickthall's translation, with Yusuf Ali and Shakir in parallel; the source of every Qur'an quotation in this stage."
          },
          {
            "title": "Qur'an 2:23 and the challenge (quran.com)",
            "url": "https://quran.com/2/23",
            "note": "The challenge to produce a sura like it, with commentary links."
          }
        ]
      ],
      [
        "The Sunna, the hadith and the Sharia",
        [
          {
            "title": "Sahih al-Bukhari 8: Islam is based on five (sunnah.com)",
            "url": "https://sunnah.com/bukhari:8",
            "note": "The hadith of the Five Pillars, in Arabic and English."
          },
          {
            "title": "Sahih al-Bukhari (sunnah.com)",
            "url": "https://sunnah.com/bukhari",
            "note": "The most trusted Sunni hadith collection, free online."
          }
        ]
      ],
      [
        "Tawhid: the oneness of God in Islam",
        [
          {
            "title": "Qur'an 112, al-Ikhlas (quran.com)",
            "url": "https://quran.com/112",
            "note": "The sura of God's oneness."
          },
          {
            "title": "Sahih al-Bukhari 5013 (sunnah.com)",
            "url": "https://sunnah.com/bukhari:5013",
            "note": "The hadith that sura 112 is equal to a third of the Qur'an."
          },
          {
            "title": "Fr John Breck, What's in a Name? (OCA)",
            "url": "https://www.oca.org/reflections/fr.-john-breck/whats-in-a-name",
            "note": "An Orthodox theologian on whether Christians and Muslims worship the same God; other Orthodox writers answer the question differently."
          }
        ]
      ],
      [
        "Tawhid and the Trinity: the Orthodox answer",
        [
          {
            "title": "St Gregory of Nazianzus, Oration 40, On Holy Baptism, tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310240.htm",
            "note": "Public domain, New Advent. Section 41, on the One and the Three."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Holy Trinity (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "Christ in the Qur'an: Jesus son of Mary, Word and Spirit",
        [
          {
            "title": "Qur'an 3:45–59 (quran.com)",
            "url": "https://quran.com/3/45-59",
            "note": "The annunciation to Mary and the likeness of Jesus to Adam."
          },
          {
            "title": "Qur'an 19, Maryam (quran.com)",
            "url": "https://quran.com/19",
            "note": "The sura of Mary, with Jesus speaking in the cradle."
          },
          {
            "title": "The Qur'an, tr. Marmaduke Pickthall (1930), in Three Translations of the Koran side by side (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/16955",
            "note": "Public domain. Pickthall's translation, with Yusuf Ali and Shakir in parallel; the source of every Qur'an quotation in this stage."
          }
        ]
      ],
      [
        "Reading: the Qur'an on Jesus, the cross and the Trinity",
        [
          {
            "title": "The Qur'an, tr. Marmaduke Pickthall (1930), in Three Translations of the Koran side by side (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/16955",
            "note": "Public domain. Pickthall's translation, with Yusuf Ali and Shakir in parallel; the source of every Qur'an quotation in this stage."
          },
          {
            "title": "Qur'an 4:157 (quran.com)",
            "url": "https://quran.com/4/157",
            "note": "The verse in Arabic with modern translations, for comparison with Pickthall."
          }
        ]
      ],
      [
        "The cross denied: Qur'an 4:157 and its readings",
        [
          {
            "title": "Tafsir Ibn Kathir on Qur'an 4:157 (quran.com)",
            "url": "https://quran.com/4:157/tafsirs/en-tafisr-ibn-kathir",
            "note": "The classical substitution reading, in an English abridgement."
          },
          {
            "title": "Mahmoud Ayoub, \"Towards an Islamic Christology II: The Death of Jesus, Reality or Delusion\", The Muslim World 70 (1980)",
            "note": "Printed article. The minority Muslim reading that 4:157 denies the Jews' power, not Jesus' death."
          }
        ]
      ],
      [
        "Reading: St Athanasius on why Christ died a public death on the cross",
        [
          {
            "title": "St Athanasius, On the Incarnation, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent. Chapters 21–25 are read in the lesson."
          }
        ]
      ],
      [
        "The cross answered: history and the meaning of the death",
        [
          {
            "title": "Tacitus, Annals, Book 15, tr. Church and Brodribb (Wikisource)",
            "url": "https://en.wikisource.org/wiki/The_Annals_(Tacitus)/Book_15",
            "note": "Public domain. Chapter 44 on Christus executed under Pilate."
          },
          {
            "title": "St Athanasius, On the Incarnation, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent. The Orthodox account of why the Word died: to destroy death."
          }
        ]
      ],
      [
        "Tahrif: the charge that the Scriptures were corrupted",
        [
          {
            "title": "Qur'an 2:75–79 (quran.com)",
            "url": "https://quran.com/2/75-79",
            "note": "The verses on those who changed or wrote scripture with their hands."
          },
          {
            "title": "Sidney H. Griffith, The Church in the Shadow of the Mosque",
            "note": "Printed book. How Christians in the early Islamic world, Orthodox among them, explained their faith in Arabic."
          }
        ]
      ],
      [
        "Tahrif answered: the manuscripts and the Qur'an's own witness",
        [
          {
            "title": "Qur'an 10:94 (quran.com)",
            "url": "https://quran.com/10/94",
            "note": "\"Question those who read the Scripture (that was) before thee.\""
          },
          {
            "title": "Qur'an 5:47 (quran.com)",
            "url": "https://quran.com/5/47",
            "note": "\"Let the People of the Gospel judge by that which Allah hath revealed therein.\""
          },
          {
            "title": "Bruce M. Metzger and Bart D. Ehrman, The Text of the New Testament",
            "note": "Printed book. The standard account of the manuscripts and their variants, by a believing and a sceptical scholar together."
          }
        ]
      ],
      [
        "Muhammad foretold? Deuteronomy 18, the Paraclete and Ahmad",
        [
          {
            "title": "Qur'an 61:6 (quran.com)",
            "url": "https://quran.com/61/6",
            "note": "Jesus' announcement of \"Ahmad\"."
          },
          {
            "title": "The Bible, King James Version (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10",
            "note": "Public domain. Deuteronomy 18 and John 14–16, read in context."
          }
        ]
      ],
      [
        "Is Muhammad a prophet? How the Church has answered",
        [
          {
            "title": "Archbishop Anastasios (Yannoulatos), Facing the World: Orthodox Christian Essays on Global Concerns",
            "note": "Printed book. The Orthodox scholar of Islam on the Church and other religions."
          },
          {
            "title": "Daniel J. Sahas, John of Damascus on Islam",
            "note": "Printed book. The Greek text and study of Damascene's chapter, the root of the sharper line."
          }
        ]
      ],
      [
        "Sunni and Shia: the split and its theology",
        [
          {
            "title": "Pew Research Center, Mapping the Global Muslim Population (2009)",
            "url": "https://www.pewresearch.org/religion/2009/10/07/mapping-the-global-muslim-population/",
            "note": "The estimate of Sunni and Shia shares and where the Shia live."
          },
          {
            "title": "Moojan Momen, An Introduction to Shi'i Islam",
            "note": "Printed book. The standard introduction to Shia history and belief."
          }
        ]
      ],
      [
        "The Sufis and Orthodox prayer",
        [
          {
            "title": "Al-Ghazali, The Confessions of Al Ghazzali, tr. Claud Field (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/58977",
            "note": "Public domain. Ghazali's own account of turning to Sufism."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Ibn Arabi",
            "url": "https://plato.stanford.edu/entries/ibn-arabi/",
            "note": "Free. The oneness of being, explained by a scholar."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Orthodox Spirituality (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality",
            "note": "Free on oca.org. For the contrast with Orthodox prayer."
          }
        ]
      ],
      [
        "St John of Damascus and \"the heresy of the Ishmaelites\"",
        [
          {
            "title": "Daniel J. Sahas, John of Damascus on Islam: The \"Heresy of the Ishmaelites\"",
            "note": "Printed book (1972). The Greek text of the chapter with a full study."
          },
          {
            "title": "OCA: Venerable John of Damascus",
            "url": "https://www.oca.org/saints/lives/2026/12/04/103473-venerable-john-of-damascus",
            "note": "The OCA's life of the saint, 4 December."
          }
        ]
      ],
      [
        "St Gregory Palamas in captivity among the Turks (1354)",
        [
          {
            "title": "OCA: Saint Gregory Palamas, Archbishop of Thessalonica",
            "url": "https://www.oca.org/saints/lives/2026/11/14/103303-saint-gregory-palamas-archbishop-of-thessalonica",
            "note": "The OCA's life of the saint, 14 November, including his captivity."
          },
          {
            "title": "Daniel J. Sahas, \"Captivity and Dialogue: Gregory Palamas and the Muslims\", Greek Orthodox Theological Review 25 (1980)",
            "note": "Printed article. The letter and the debates, with translation and study."
          }
        ]
      ],
      [
        "Manuel II and the Persian, and Regensburg 2006",
        [
          {
            "title": "Benedict XVI, Faith, Reason and the University (Regensburg, 12 September 2006)",
            "url": "https://www.vatican.va/content/benedict-xvi/en/speeches/2006/september/documents/hf_ben-xvi_spe_20060912_university-regensburg.html",
            "note": "The lecture that quoted Manuel II's Seventh Dialogue."
          },
          {
            "title": "A Common Word Between Us and You (2007)",
            "url": "https://www.acommonword.com/",
            "note": "The Muslim scholars' open letter that followed."
          }
        ]
      ],
      [
        "History told honestly: conquest, dhimmis and Christian wrongs",
        [
          {
            "title": "Qur'an 9:29 (quran.com)",
            "url": "https://quran.com/9/29",
            "note": "The verse on the jizya."
          },
          {
            "title": "Andrew Wheatcroft, Infidels: A History of the Conflict between Christendom and Islam",
            "note": "Printed book. Both sides' wrongs, told plainly."
          },
          {
            "title": "Sidney H. Griffith, The Church in the Shadow of the Mosque",
            "note": "Printed book. How Christians in the early Islamic world, Orthodox among them, explained their faith in Arabic."
          }
        ]
      ],
      [
        "Modern da'wa: Deedat, Naik and the online debates, as of November 2026",
        [
          {
            "title": "Qur'an 29:46 (quran.com)",
            "url": "https://quran.com/29/46",
            "note": "\"Argue not with the People of the Scripture unless it be in (a way) that is better.\""
          },
          {
            "title": "Fr Andrew Stephen Damick, Orthodoxy and Heterodoxy",
            "note": "Printed book. Includes an Orthodox chapter on Islam."
          }
        ]
      ],
      [
        "\"Where did Jesus say 'I am God'?\": the da'wa questions answered",
        [
          {
            "title": "The Bible, King James Version (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10",
            "note": "Public domain. Mark 2 and 14, John 8, 10 and 20."
          },
          {
            "title": "St Gregory of Nazianzus, Fourth Theological Oration (Oration 30), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310230.htm",
            "note": "Public domain, New Advent. How the Fathers read the sayings of Christ about Himself."
          }
        ]
      ],
      [
        "Looking back: Islam",
        [
          {
            "title": "The Qur'an, tr. Marmaduke Pickthall (1930), in Three Translations of the Koran side by side (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/16955",
            "note": "Public domain. Pickthall's translation, with Yusuf Ali and Shakir in parallel; the source of every Qur'an quotation in this stage."
          },
          {
            "title": "Sidney H. Griffith, The Church in the Shadow of the Mosque",
            "note": "Printed book. How Christians in the early Islamic world, Orthodox among them, explained their faith in Arabic."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 10 · The religions of India and the East",
    "lessons": [
      [
        "Context: the religions of India and the East",
        [
          {
            "title": "Pew Research Center, How the Global Religious Landscape Changed From 2010 to 2020 (2025)",
            "url": "https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/",
            "note": "The figures for Hindus and Buddhists."
          },
          {
            "title": "SuttaCentral: early Buddhist texts, tr. Bhikkhu Sujato (CC0)",
            "url": "https://suttacentral.net/sn56.11/en/sujato",
            "note": "Free. The Pali Canon in a modern public-domain translation; the source of the Buddhist quotations in this stage."
          }
        ]
      ],
      [
        "The Vedas and the Upanishads: Hinduism's scriptures",
        [
          {
            "title": "The Upanishads, Part 1, tr. F. Max Müller (Sacred Books of the East 1, 1879): Chandogya VI, 8",
            "url": "https://archive.org/details/upanishads01ml",
            "note": "Public domain, Internet Archive scan. Chandogya VI, 8, the \"thou art it\" passage quoted in the lesson."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Shankara",
            "url": "https://plato.stanford.edu/entries/shankara/",
            "note": "Free. Background on the Vedanta reading of the Upanishads."
          }
        ]
      ],
      [
        "Brahman and Atman: Shankara's Advaita Vedanta",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Shankara",
            "url": "https://plato.stanford.edu/entries/shankara/",
            "note": "Free. Advaita set out by a scholar of the school."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Holy Trinity (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity",
            "note": "Free on oca.org. God as personal Trinity, against an impersonal Absolute."
          }
        ]
      ],
      [
        "Vishnu, Shiva and bhakti: the devotional Hinduism of Ramanuja and Madhva",
        [
          {
            "title": "Sir Edwin Arnold, The Song Celestial, or Bhagavad-Gita (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/2388",
            "note": "Public domain (1885). The scripture of the bhakti traditions."
          },
          {
            "title": "Julius Lipner, Hindus: Their Religious Beliefs and Practices",
            "note": "Printed book. A Hindu-born Catholic scholar's fair account of Vaishnava, Shaiva and Shakta traditions."
          }
        ]
      ],
      [
        "The Bhagavad Gita: Krishna, duty and devotion",
        [
          {
            "title": "Sir Edwin Arnold, The Song Celestial, or Bhagavad-Gita (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/2388",
            "note": "Public domain (1885). Chapters 2 (the deathless Self) and 18 (\"Fly to Me alone\")."
          }
        ]
      ],
      [
        "The avatars and the Incarnation",
        [
          {
            "title": "Sir Edwin Arnold, The Song Celestial, or Bhagavad-Gita (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/2388",
            "note": "Public domain (1885). Chapter 4, the avatar passage quoted in the lesson."
          },
          {
            "title": "St Athanasius, On the Incarnation, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent. Why the Word took a real body, once and for ever."
          }
        ]
      ],
      [
        "Karma and rebirth: the Hindu and Buddhist teaching",
        [
          {
            "title": "The Upanishads, Part 2, tr. F. Max Müller (Sacred Books of the East 15, 1884): Brihadaranyaka IV, 4",
            "url": "https://archive.org/details/wg915",
            "note": "Public domain, Internet Archive scan. The earliest statement of karma and rebirth, read in the next lesson."
          },
          {
            "title": "Pew Research Center, How the Global Religious Landscape Changed From 2010 to 2020 (2025)",
            "url": "https://www.pewresearch.org/religion/2025/06/09/how-the-global-religious-landscape-changed-from-2010-to-2020/",
            "note": "The figures for Hindus and Buddhists."
          }
        ]
      ],
      [
        "Reading: the Brihadaranyaka Upanishad on karma and rebirth",
        [
          {
            "title": "The Upanishads, Part 2, tr. F. Max Müller (Sacred Books of the East 15, 1884): Brihadaranyaka IV, 4",
            "url": "https://archive.org/details/wg915",
            "note": "Public domain, Internet Archive scan. Verses 3–7 are read in the lesson."
          }
        ]
      ],
      [
        "Reading: St Gregory of Nyssa against the passing of souls",
        [
          {
            "title": "St Gregory of Nyssa, On the Making of Man, tr. H. A. Wilson (NPNF 2/5, 1893)",
            "url": "https://www.newadvent.org/fathers/2914.htm",
            "note": "Public domain, New Advent. Chapters 28–29 are read in the lesson."
          }
        ]
      ],
      [
        "Karma and rebirth answered: one life, the resurrection and mercy",
        [
          {
            "title": "St Gregory of Nyssa, On the Making of Man, tr. H. A. Wilson (NPNF 2/5, 1893)",
            "url": "https://www.newadvent.org/fathers/2914.htm",
            "note": "Public domain, New Advent. Soul and body begun together."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Orthodox Spirituality (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "Yoga in the Yoga Sutras of Patanjali",
        [
          {
            "title": "The Yoga Sutras of Patanjali, tr. Charles Johnston (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/2526",
            "note": "Public domain (1912). A free translation with a Theosophical flavour; compare a modern scholarly one."
          },
          {
            "title": "Metropolitan Hierotheos (Vlachos), The Difference between Orthodox Spirituality and Other Traditions",
            "note": "Printed book. Hesychasm set beside Eastern meditation, from the Fathers."
          }
        ]
      ],
      [
        "The Buddha and the Four Noble Truths",
        [
          {
            "title": "Rolling Forth the Wheel of Dhamma (SN 56.11), tr. Bhikkhu Sujato (SuttaCentral)",
            "url": "https://suttacentral.net/sn56.11/en/sujato",
            "note": "CC0. The first sermon, quoted in the lesson."
          },
          {
            "title": "Bhikkhu Bodhi, In the Buddha's Words",
            "note": "Printed book. The best anthology of the Pali Canon, by a Theravada monk."
          }
        ]
      ],
      [
        "No-self (anatta) and the person",
        [
          {
            "title": "The Characteristic of Not-Self (SN 22.59), tr. Bhikkhu Sujato (SuttaCentral)",
            "url": "https://suttacentral.net/sn22.59/en/sujato",
            "note": "CC0. The second sermon, quoted in the lesson."
          },
          {
            "title": "Vladimir Lossky, In the Image and Likeness of God",
            "note": "Printed book. Includes his essay on the theological notion of the human person."
          }
        ]
      ],
      [
        "Nirvana and the Kingdom",
        [
          {
            "title": "About Extinguishment (Udana 8.3), tr. Bhikkhu Sujato (SuttaCentral)",
            "url": "https://suttacentral.net/ud8.3/en/sujato",
            "note": "CC0. The passage on the unconditioned, quoted in the lesson."
          },
          {
            "title": "The Shorter Discourse With Malunkyaputta (MN 63), tr. Bhikkhu Sujato (SuttaCentral)",
            "url": "https://suttacentral.net/mn63/en/sujato",
            "note": "CC0. The undeclared questions, including whether the awakened one exists after death."
          }
        ]
      ],
      [
        "The Mahayana: the bodhisattva, emptiness and Pure Land",
        [
          {
            "title": "Buddhist Mahayana Texts (Sacred Books of the East 49, 1894)",
            "url": "https://archive.org/details/buddhistmahy02cowe",
            "note": "Public domain, Internet Archive scan. Includes the Pure Land sutras and the Diamond and Heart sutras in Max Müller's and others' translations."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Nagarjuna",
            "url": "https://plato.stanford.edu/entries/nagarjuna/",
            "note": "Free. Emptiness explained by a scholar."
          }
        ]
      ],
      [
        "Zen: sitting, koans and seeing one's own nature",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Japanese Zen Buddhist Philosophy",
            "url": "https://plato.stanford.edu/entries/japanese-zen/",
            "note": "Free. Dogen, Rinzai and the koan."
          },
          {
            "title": "Metropolitan Hierotheos (Vlachos), The Difference between Orthodox Spirituality and Other Traditions",
            "note": "Printed book. Hesychasm set beside Eastern meditation, from the Fathers."
          }
        ]
      ],
      [
        "Tibetan Buddhism and the Dalai Lama",
        [
          {
            "title": "Statement Affirming the Continuation of the Institution of Dalai Lama (2 July 2025, dalailama.com)",
            "url": "https://www.dalailama.com/the-dalai-lama/biography-and-daily-life/reincarnation/statement-affirming-the-continuation-of-the-institution-of-dalai-lama-july-2-2025",
            "note": "The Dalai Lama's own statement on the succession."
          },
          {
            "title": "Fr Seraphim Rose, Orthodoxy and the Religion of the Future",
            "note": "Printed book (1975). An American convert, once a student of Eastern religions, on Eastern meditation and Christianity."
          }
        ]
      ],
      [
        "The Buddha and Christ: the answer to Buddhism",
        [
          {
            "title": "Rolling Forth the Wheel of Dhamma (SN 56.11), tr. Bhikkhu Sujato (SuttaCentral)",
            "url": "https://suttacentral.net/sn56.11/en/sujato",
            "note": "CC0. The Buddha's own statement of his path."
          },
          {
            "title": "St Athanasius, On the Incarnation, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent. God entering death to destroy it."
          }
        ]
      ],
      [
        "Jainism: the soul, karma and non-violence",
        [
          {
            "title": "Jaina Sutras, Part 1, tr. Hermann Jacobi (Sacred Books of the East 22, 1884)",
            "url": "https://archive.org/details/sacredbookseast17mulluoft",
            "note": "Public domain, Internet Archive scan. The Akaranga Sutra and Kalpa Sutra, with the life of Mahavira and the vows."
          }
        ]
      ],
      [
        "Sikhism: the one God and the Gurus",
        [
          {
            "title": "Sri Granth: the Guru Granth Sahib online",
            "url": "https://www.srigranth.org/",
            "note": "Free. The Sikh scripture in Gurmukhi with English translation."
          },
          {
            "title": "W. H. McLeod, Sikhism",
            "note": "Printed book. A standard scholarly introduction to Sikh history and belief."
          }
        ]
      ],
      [
        "Taoism: the Way that cannot be named",
        [
          {
            "title": "The Tao Teh King, tr. James Legge (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/216",
            "note": "Public domain (1891). Chapters 1 and 25 are quoted in the lesson."
          },
          {
            "title": "Hieromonk Damascene, Christ the Eternal Tao",
            "note": "Printed book (1999). An Orthodox monk's reading of Laozi in the light of the Logos; the more generous Orthodox view."
          }
        ]
      ],
      [
        "Confucius, the ancestors and the Orthodox in China",
        [
          {
            "title": "The Analects of Confucius, tr. James Legge (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/3330",
            "note": "Public domain. The sayings of Confucius."
          },
          {
            "title": "OCA: Hieromartyr Metrophanes (Chang Tzi-tzung) and the martyrs of the Boxer Rising",
            "url": "https://www.oca.org/saints/lives/2026/06/11/205368-hieromartyr-metrophanes-chang-tzi-tzung-first-chinese-priest-and",
            "note": "The OCA's life of the Chinese martyrs of 1900, commemorated 11 June."
          }
        ]
      ],
      [
        "Vlachos and Rose: Orthodox prayer and Eastern meditation",
        [
          {
            "title": "Metropolitan Hierotheos (Vlachos), The Difference between Orthodox Spirituality and Other Traditions",
            "note": "Printed book. Hesychasm set beside Eastern meditation, from the Fathers."
          },
          {
            "title": "Fr Seraphim Rose, Orthodoxy and the Religion of the Future",
            "note": "Printed book (1975). An American convert, once a student of Eastern religions, on Eastern meditation and Christianity."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Orthodox Spirituality (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality",
            "note": "Free on oca.org. Prayer and the Jesus Prayer in Orthodox teaching."
          }
        ]
      ],
      [
        "Vivekananda, 1893, and the East comes West",
        [
          {
            "title": "Swami Vivekananda, Response to Welcome, Parliament of Religions, 11 September 1893 (Wikisource)",
            "url": "https://en.wikisource.org/wiki/The_Complete_Works_of_Swami_Vivekananda/Volume_1/Addresses_at_The_Parliament_of_Religions/Response_to_Welcome",
            "note": "Public domain. The speech that began the modern Western turn East."
          },
          {
            "title": "Fr Seraphim Rose, Orthodoxy and the Religion of the Future",
            "note": "Printed book (1975). An American convert, once a student of Eastern religions, on Eastern meditation and Christianity."
          }
        ]
      ],
      [
        "\"All religions are one\": the perennialists' case",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Religious Pluralism",
            "url": "https://plato.stanford.edu/entries/religious-pluralism/",
            "note": "Free. Hick's pluralism and its critics."
          },
          {
            "title": "Followers of Various Other Religions (Udana 6.4), tr. Bhikkhu Sujato (SuttaCentral)",
            "url": "https://suttacentral.net/ud6.4/en/sujato",
            "note": "CC0. The original parable of the blind men and the elephant."
          },
          {
            "title": "Frithjof Schuon, The Transcendent Unity of Religions",
            "note": "Printed book (1948). The Traditionalist case at its strongest."
          }
        ]
      ],
      [
        "\"All religions are one\" answered",
        [
          {
            "title": "Followers of Various Other Religions (Udana 6.4), tr. Bhikkhu Sujato (SuttaCentral)",
            "url": "https://suttacentral.net/ud6.4/en/sujato",
            "note": "CC0. The parable read in full: the king sees the elephant."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Religious Pluralism",
            "url": "https://plato.stanford.edu/entries/religious-pluralism/",
            "note": "Free. The objections to pluralism set out fairly."
          }
        ]
      ],
      [
        "Seeds of the Word, and what may be hoped for those outside",
        [
          {
            "title": "St Justin Martyr, Second Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0127.htm",
            "note": "Public domain, New Advent. Chapters 10 and 13 on the seeds of the Word in all men."
          },
          {
            "title": "St Clement of Alexandria, Stromata, Book 1, tr. William Wilson (ANF 2, 1885)",
            "url": "https://www.newadvent.org/fathers/02101.htm",
            "note": "Public domain, New Advent. Chapter 5: philosophy as a schoolmaster to Christ."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book. Metropolitan Kallistos on the Church and those outside her visible bounds."
          }
        ]
      ],
      [
        "Looking back: the religions of India and the East",
        [
          {
            "title": "St Justin Martyr, Second Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0127.htm",
            "note": "Public domain, New Advent. Chapters 10 and 13 on the seeds of the Word in all men."
          },
          {
            "title": "Metropolitan Hierotheos (Vlachos), The Difference between Orthodox Spirituality and Other Traditions",
            "note": "Printed book. Hesychasm set beside Eastern meditation, from the Fathers."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 11 · The old gods and the New Age",
    "lessons": [
      [
        "Context: the old gods, the occult and the New Age",
        [
          {
            "title": "St Athanasius, Against the Heathen, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2801.htm",
            "note": "Public domain, New Advent. The classic patristic answer to the worship of the gods."
          },
          {
            "title": "Fr Seraphim Rose, Orthodoxy and the Religion of the Future",
            "note": "Printed book (1975). The Orthodox survey of the modern spiritual movements this stage covers."
          }
        ]
      ],
      [
        "Idolatry and the demons: how Scripture and the Fathers read the gods",
        [
          {
            "title": "Psalm 95 in Brenton's Septuagint (1844)",
            "url": "https://ebible.org/eng-Brenton/PSA095.htm",
            "note": "Public domain. Verse 5: \"all the gods of the heathen are devils\"."
          },
          {
            "title": "1 Corinthians 10 (KJV)",
            "url": "https://ebible.org/eng-kjv/1CO10.htm",
            "note": "St Paul on idol meat and sacrifice to devils (verses 19–21)."
          },
          {
            "title": "St Justin Martyr, First Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Public domain, New Advent. On the demons behind the myths, and the seeds of the Word among the Greeks."
          }
        ]
      ],
      [
        "African traditional religion: Mwari, uNkulunkulu and the high God",
        [
          {
            "title": "Acts 17 (KJV)",
            "url": "https://ebible.org/eng-kjv/ACT17.htm",
            "note": "St Paul at the Areopagus: \"Whom therefore ye ignorantly worship, him declare I unto you.\""
          },
          {
            "title": "John S. Mbiti, African Religions and Philosophy",
            "note": "Printed book (1969). The classic account by a Kenyan Anglican theologian; read as the best defender of the traditional view."
          },
          {
            "title": "Michael Bourdillon, The Shona Peoples",
            "note": "Printed book (1976 and later editions). A standard ethnography of Shona religion, Mwari and the ancestors."
          }
        ]
      ],
      [
        "The ancestors: vadzimu, amadlozi and the living dead",
        [
          {
            "title": "Michael Bourdillon, The Shona Peoples",
            "note": "Printed book. The chapters on the *vadzimu*, *mhondoro* and spirit mediums."
          },
          {
            "title": "Axel-Ivar Berglund, Zulu Thought-Patterns and Symbolism",
            "note": "Printed book (1976). The ancestors (*amadlozi*) and diviners in Zulu religion, from long fieldwork."
          }
        ]
      ],
      [
        "The n'anga, the sangoma and the inyanga: healers, diviners and witchcraft",
        [
          {
            "title": "Deuteronomy 18 (KJV)",
            "url": "https://ebible.org/eng-kjv/DEU18.htm",
            "note": "Verses 10–12: the forbidden arts of divination and spirit-consultation."
          },
          {
            "title": "The Canons of the Council in Trullo (692), tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3814.htm",
            "note": "Public domain, New Advent. Canon 61 on soothsayers, fortune-tellers and amulet-givers."
          }
        ]
      ],
      [
        "The rites of the dead: kurova guva, ngozi and where Christians disagree",
        [
          {
            "title": "1 Corinthians 10 (KJV)",
            "url": "https://ebible.org/eng-kjv/1CO10.htm",
            "note": "Verse 21: \"Ye cannot drink the cup of the Lord, and the cup of devils.\""
          },
          {
            "title": "Michael Bourdillon, The Shona Peoples",
            "note": "Printed book. On *kurova guva*, *bira* and *ngozi*."
          }
        ]
      ],
      [
        "The Orthodox answer on the ancestors: the communion of saints and prayer for the dead",
        [
          {
            "title": "St John Chrysostom, Homily on the Paschal Feast (the Paschal Homily), OCA",
            "url": "https://www.oca.org/fs/sermons/the-paschal-sermon",
            "note": "Read at every Paschal matins; the source of the paraphrased line on the empty tombs."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 2: Memorial Services (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/funeral",
            "note": "Free on oca.org. The Orthodox funeral and memorials for the departed."
          }
        ]
      ],
      [
        "Paganism, ancient and revived: Julian, Hellenism and the new heathens",
        [
          {
            "title": "Julian, Against the Galileans, tr. Wilmer Cave Wright (Loeb, 1923)",
            "note": "Printed (Loeb Julian vol. 3). The pagan emperor's case in his own words."
          },
          {
            "title": "Ronald Hutton, Pagan Britain",
            "note": "Printed book (2013). A sympathetic historian on what is known and what is reconstructed in modern paganism."
          },
          {
            "title": "St Athanasius, Against the Heathen (NPNF 2/4)",
            "url": "https://www.newadvent.org/fathers/2801.htm",
            "note": "Public domain, New Advent. The answer to the gods from the order of creation."
          }
        ]
      ],
      [
        "Wicca: Gardner, the Goddess and the God",
        [
          {
            "title": "Gerald Gardner, Witchcraft Today",
            "note": "Printed book (1954). Wicca as its founder presented it."
          },
          {
            "title": "Ronald Hutton, The Triumph of the Moon: A History of Modern Pagan Witchcraft",
            "note": "Printed book (1999). The standard history, sympathetic to Wicca, which set aside Murray's thesis."
          }
        ]
      ],
      [
        "Answering Wicca and modern paganism: creation, the feminine and magic",
        [
          {
            "title": "St Basil, Letter 217 (the third canonical letter), tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/3202217.htm",
            "note": "Public domain, New Advent. Canon 65 on magic and sorcery."
          },
          {
            "title": "St Gregory of Nazianzus, Fifth Theological Oration (Oration 31), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310231.htm",
            "note": "Public domain, New Advent. Section 7: the Godhead is not male."
          }
        ]
      ],
      [
        "Spiritualism and the séance: contact with the dead",
        [
          {
            "title": "1 Samuel 28 (KJV)",
            "url": "https://ebible.org/eng-kjv/1SA28.htm",
            "note": "Saul and the woman at Endor."
          },
          {
            "title": "Deuteronomy 18 (KJV)",
            "url": "https://ebible.org/eng-kjv/DEU18.htm",
            "note": "Verse 11: the consulter with familiar spirits and the necromancer."
          }
        ]
      ],
      [
        "Astrology and divination: the Fathers against fate",
        [
          {
            "title": "St Basil, Hexaemeron, Homily 6, tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/32016.htm",
            "note": "Public domain, New Advent. Sections 5–7 against astrology; quoted in the lesson."
          },
          {
            "title": "St Augustine, Confessions, Book VII, tr. J. G. Pilkington (NPNF 1/1, 1886)",
            "url": "https://www.newadvent.org/fathers/110107.htm",
            "note": "Public domain, New Advent. Chapter 6: the argument from twins."
          },
          {
            "title": "Pew Research Center, New Age beliefs common among both religious and nonreligious Americans (2018)",
            "url": "https://www.pewresearch.org/short-reads/2018/10/01/new-age-beliefs-common-among-both-religious-and-nonreligious-americans/",
            "note": "The survey figures for astrology and reincarnation."
          }
        ]
      ],
      [
        "Theosophy: Blavatsky, the Masters and the Secret Doctrine",
        [
          {
            "title": "H. P. Blavatsky, The Key to Theosophy (1889), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/55618",
            "note": "Public domain. Her own introduction; the three objects and the denial of a personal God are quoted."
          },
          {
            "title": "H. P. Blavatsky, The Secret Doctrine, vol. 1 (1888), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/54824",
            "note": "Public domain. The main work, for those who want the system in full."
          }
        ]
      ],
      [
        "Reading: Blavatsky's Key to Theosophy on reincarnation and memory",
        [
          {
            "title": "H. P. Blavatsky, The Key to Theosophy (1889), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/55618",
            "note": "Public domain. Section VIII, 'On Re-incarnation or Rebirth', is read here."
          }
        ]
      ],
      [
        "Reading: St Irenaeus against the transmigration of souls",
        [
          {
            "title": "St Irenaeus, Against Heresies II.33, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103233.htm",
            "note": "Public domain, New Advent. The chapter read here."
          },
          {
            "title": "Hebrews 9 (KJV)",
            "url": "https://ebible.org/eng-kjv/HEB09.htm",
            "note": "Verse 27: \"it is appointed unto men once to die\"."
          }
        ]
      ],
      [
        "Anthroposophy: Rudolf Steiner and his Christ",
        [
          {
            "title": "Rudolf Steiner, The Gospel of St Luke (lectures, Basel, 1909; GA 114)",
            "note": "Printed (Anthroposophic Press and Rudolf Steiner Press). Steiner's own lectures, including the teaching on the two Jesus children."
          },
          {
            "title": "The Definition of Chalcedon (451)",
            "note": "Printed in any collection of the councils; taught in Theology Stage 7. The one person of the eternal Son, against a Christ who enters a man."
          }
        ]
      ],
      [
        "The New Age: the Age of Aquarius and spirituality without religion",
        [
          {
            "title": "Pew Research Center, New Age beliefs common among both religious and nonreligious Americans (2018)",
            "url": "https://www.pewresearch.org/short-reads/2018/10/01/new-age-beliefs-common-among-both-religious-and-nonreligious-americans/",
            "note": "The figures quoted in the lesson."
          },
          {
            "title": "Wouter Hanegraaff, New Age Religion and Western Culture",
            "note": "Printed book (1996). The standard scholarly study of New Age beliefs, from their own texts."
          }
        ]
      ],
      [
        "Answering the New Age: the god within and the God who comes",
        [
          {
            "title": "1 John 4 (KJV)",
            "url": "https://ebible.org/eng-kjv/1JN04.htm",
            "note": "\"Try the spirits whether they are of God.\""
          },
          {
            "title": "Pontifical Councils for Culture and for Interreligious Dialogue, Jesus Christ the Bearer of the Water of Life (2003)",
            "url": "https://www.vatican.va/roman_curia/pontifical_councils/interelg/documents/rc_pc_interelg_doc_20030203_new-age_en.html",
            "note": "A Catholic survey of the New Age; useful for its detail, not an Orthodox text."
          }
        ]
      ],
      [
        "Fr Seraphim Rose: Orthodoxy and the Religion of the Future",
        [
          {
            "title": "Fr Seraphim Rose, Orthodoxy and the Religion of the Future",
            "note": "Printed book (1975, St Herman of Alaska Brotherhood). Summarised and paraphrased in the lesson."
          },
          {
            "title": "Hieromonk Damascene, Father Seraphim Rose: His Life and Works",
            "note": "Printed book. The full biography, including the writing of this book."
          }
        ]
      ],
      [
        "Freemasonry: what it is and what it says of itself",
        [
          {
            "title": "Anderson's Charges of a Free-Mason (1723), with later versions",
            "url": "https://sites.google.com/site/tsmr99/charges-antient",
            "note": "A transcription of the 1723 Charges beside later editions; the 1723 text is public domain and quoted in the lesson."
          },
          {
            "title": "Orthodox History: Freemasonry in American Orthodox History",
            "url": "https://www.orthodoxhistory.org/2012/11/20/freemasonry-in-american-orthodox-history/",
            "note": "The Society for Orthodox Christian History in the Americas; honest about Masons among Orthodox clergy and laity."
          }
        ]
      ],
      [
        "The Orthodox Church's rulings on Freemasonry",
        [
          {
            "title": "Freemasonry: Official Statement of the Church of Greece (1933)",
            "url": "https://www.johnsanidopoulos.com/2010/01/freemasonry-official-statement-of.html",
            "note": "An English translation of the 1933 statement, paraphrased in the lesson."
          },
          {
            "title": "Congregation for the Doctrine of the Faith, Declaration on Masonic Associations (1983)",
            "url": "https://www.vatican.va/roman_curia/congregations/cfaith/documents/rc_con_cfaith_doc_19831126_declaration-masonic_en.html",
            "note": "The Roman Catholic ruling, for comparison."
          }
        ]
      ],
      [
        "Looking back: one God among the gods, spirits and powers",
        [
          {
            "title": "St Athanasius, Against the Heathen (NPNF 2/4)",
            "url": "https://www.newadvent.org/fathers/2801.htm",
            "note": "Public domain, New Advent. The patristic case for the one God against the many."
          },
          {
            "title": "Fr Seraphim Rose, Orthodoxy and the Religion of the Future",
            "note": "Printed book. The Orthodox reading of the whole modern spiritual scene."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 12 · Atheism and the modern objections",
    "lessons": [
      [
        "Context: unbelief in the modern world",
        [
          {
            "title": "Pew Research Center, Religiously unaffiliated population change, 2010–2020 (2025)",
            "url": "https://www.pewresearch.org/religion/2025/06/09/religiously-unaffiliated-population-change/",
            "note": "The global figures quoted in the lesson."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Atheism and Agnosticism",
            "url": "https://plato.stanford.edu/entries/atheism-agnosticism/",
            "note": "A careful survey of the positions, by a sympathetic author."
          }
        ]
      ],
      [
        "What atheism is: atheism, agnosticism and naturalism",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Atheism and Agnosticism",
            "url": "https://plato.stanford.edu/entries/atheism-agnosticism/",
            "note": "The definitions, including the 'lack of belief' debate."
          },
          {
            "title": "St Justin Martyr, First Apology, tr. Dods and Reith (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Public domain, New Advent. Chapter 6: Christians called atheists."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Naturalism",
            "url": "https://plato.stanford.edu/entries/naturalism/",
            "note": "The position behind most modern atheism, from its defenders' side."
          }
        ]
      ],
      [
        "The problem of evil: the logical and the evidential arguments",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: The Problem of Evil",
            "url": "https://plato.stanford.edu/entries/evil/",
            "note": "The logical and evidential arguments and the replies."
          },
          {
            "title": "Alvin Plantinga, God, Freedom, and Evil",
            "note": "Printed book (1974). The free will defence."
          }
        ]
      ],
      [
        "The Orthodox answer to suffering: freedom, the fall and the Cross",
        [
          {
            "title": "St Basil the Great, On the Human Condition, tr. Nonna Verna Harrison",
            "note": "Printed book (St Vladimir's Seminary Press). Contains the homily That God Is Not the Author of Evil."
          },
          {
            "title": "Job 38 (KJV)",
            "url": "https://ebible.org/eng-kjv/JOB38.htm",
            "note": "God answers Job from the whirlwind."
          },
          {
            "title": "David Bentley Hart, The Doors of the Sea: Where Was God in the Tsunami?",
            "note": "Printed book (2005). An Orthodox writer's answer to natural evil, refusing to call evil good."
          }
        ]
      ],
      [
        "Reading: Hume's Dialogues, Part X, and Epicurus's old questions",
        [
          {
            "title": "David Hume, Dialogues Concerning Natural Religion (1779), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/4583",
            "note": "Public domain. Part X is read here."
          }
        ]
      ],
      [
        "Reading: St John Chrysostom, that no one can be harmed except by himself",
        [
          {
            "title": "St John Chrysostom, No One Can Harm the Man Who Does Not Harm Himself, tr. W. R. W. Stephens (NPNF 1/9, 1889)",
            "url": "https://www.newadvent.org/fathers/1902.htm",
            "note": "Public domain, New Advent. The treatise read here."
          }
        ]
      ],
      [
        "Divine hiddenness: why does God not make Himself plain?",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Hiddenness of God",
            "url": "https://plato.stanford.edu/entries/divine-hiddenness/",
            "note": "Schellenberg's argument and the replies."
          },
          {
            "title": "Isaiah 45 (KJV)",
            "url": "https://ebible.org/eng-kjv/ISA45.htm",
            "note": "Verse 15: \"Verily thou art a God that hidest thyself\"."
          }
        ]
      ],
      [
        "Feuerbach: God as the projection of man",
        [
          {
            "title": "Ludwig Feuerbach, The Essence of Christianity, tr. Marian Evans (1854; 1881 edition), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/47025",
            "note": "Public domain. Quoted in the lesson."
          },
          {
            "title": "Henri de Lubac, The Drama of Atheist Humanism",
            "note": "Printed book (1944; English 1949). A Catholic theologian's classic answer to Feuerbach, Nietzsche and Comte."
          }
        ]
      ],
      [
        "Marx: religion as the opium of the people, and the Soviet experiment",
        [
          {
            "title": "Joachim Eberhardt, Religion als 'das Opium des Volkes' (Lippische Landesbibliothek, 2019)",
            "url": "https://www.llb-detmold.de/wp-content/uploads/PDFs/Texte/2019-3_Eberhardt_Religion_Opium.pdf",
            "note": "Free PDF, in German. Gives Marx's 1844 sentence in its original spelling, with its context."
          },
          {
            "title": "Dimitry Pospielovsky, The Russian Church under the Soviet Regime, 1917–1982",
            "note": "Printed book (1984). The history of the Soviet campaign against the Church."
          }
        ]
      ],
      [
        "Freud: religion as wish-fulfilment and illusion",
        [
          {
            "title": "Sigmund Freud, The Future of an Illusion",
            "note": "Printed book (1927). Paraphrased in the lesson; English translations in copyright."
          },
          {
            "title": "Paul C. Vitz, Faith of the Fatherless: The Psychology of Atheism",
            "note": "Printed book (1999). Freud's method turned on the atheists."
          }
        ]
      ],
      [
        "Answering the projection theories: the genetic fallacy and the double edge",
        [
          {
            "title": "Psalm 14 (KJV)",
            "url": "https://ebible.org/eng-kjv/PSA014.htm",
            "note": "\"The fool hath said in his heart, There is no God.\""
          },
          {
            "title": "Merold Westphal, Suspicion and Faith: The Religious Uses of Modern Atheism",
            "note": "Printed book (1993). A Christian philosopher on what believers can learn from Marx, Nietzsche and Freud."
          }
        ]
      ],
      [
        "Hume on miracles: the argument",
        [
          {
            "title": "David Hume, An Enquiry Concerning Human Understanding (1748), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/9662",
            "note": "Public domain. Section X, 'Of Miracles', quoted in the lesson."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Miracles",
            "url": "https://plato.stanford.edu/entries/miracles/",
            "note": "Hume's argument and its readings."
          }
        ]
      ],
      [
        "Answering Hume on miracles: what a miracle is and what the evidence must do",
        [
          {
            "title": "St Augustine, City of God, Book XXI, tr. Marcus Dods (NPNF 1/2, 1887)",
            "url": "https://www.newadvent.org/fathers/120121.htm",
            "note": "Public domain, New Advent. Chapter 8: a portent is not against nature but against what is known of nature."
          },
          {
            "title": "John Earman, Hume's Abject Failure: The Argument Against Miracles",
            "note": "Printed book (2000). A non-Christian philosopher of science against Hume's maxim."
          },
          {
            "title": "1 Corinthians 15 (KJV)",
            "url": "https://ebible.org/eng-kjv/1CO15.htm",
            "note": "The list of witnesses, verses 3–8."
          }
        ]
      ],
      [
        "The New Atheists: Dawkins, Harris, Hitchens and Dennett",
        [
          {
            "title": "Internet Encyclopedia of Philosophy: New Atheism",
            "url": "https://iep.utm.edu/new-atheism/",
            "note": "A survey of the movement's claims and its critics."
          },
          {
            "title": "Richard Dawkins, The God Delusion",
            "note": "Printed book (2006). The movement's best-known case, read as its own best defender."
          }
        ]
      ],
      [
        "Dawkins's central argument: who designed the designer?",
        [
          {
            "title": "David Bentley Hart, The Experience of God: Being, Consciousness, Bliss",
            "note": "Printed book (2013). An Orthodox philosopher on the classical God the New Atheists did not address."
          },
          {
            "title": "Alister McGrath and Joanna Collicutt McGrath, The Dawkins Delusion?",
            "note": "Printed book (2007). A direct reply to The God Delusion."
          }
        ]
      ],
      [
        "Science and scientism: the warfare myth and the limits of method",
        [
          {
            "title": "Ronald L. Numbers (ed.), Galileo Goes to Jail and Other Myths about Science and Religion",
            "note": "Printed book (2009). Historians, believers and not, on the warfare myth."
          },
          {
            "title": "St Basil, Hexaemeron, Homily IX, tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/32019.htm",
            "note": "Public domain, New Advent. A Father reading creation with the science of his day."
          }
        ]
      ],
      [
        "Evolution and the atheist argument: where Orthodox writers differ",
        [
          {
            "title": "Charles Darwin, On the Origin of Species (1859), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/1228",
            "note": "Public domain. The first edition."
          },
          {
            "title": "Fr Seraphim Rose, Genesis, Creation, and Early Man",
            "note": "Printed book (2000). The literal patristic view."
          },
          {
            "title": "Theodosius Dobzhansky, 'Nothing in Biology Makes Sense Except in the Light of Evolution'",
            "note": "Essay in The American Biology Teacher (1973), by an Orthodox geneticist; the view compatible with evolution."
          }
        ]
      ],
      [
        "Naturalism and the mind: consciousness and the argument from reason",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Consciousness",
            "url": "https://plato.stanford.edu/entries/consciousness/",
            "note": "The hard problem and the naturalist replies."
          },
          {
            "title": "Thomas Nagel, Mind and Cosmos",
            "note": "Printed book (2012). An atheist against materialist neo-Darwinism."
          },
          {
            "title": "Alvin Plantinga, Where the Conflict Really Lies",
            "note": "Printed book (2011). The evolutionary argument against naturalism."
          }
        ]
      ],
      [
        "Morality without God: the atheist case",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Moral Realism",
            "url": "https://plato.stanford.edu/entries/moral-realism/",
            "note": "Including secular realism and the error theory."
          },
          {
            "title": "Erik Wielenberg, Robust Ethics",
            "note": "Printed book (2014). The strongest atheist case for objective morality without God."
          }
        ]
      ],
      [
        "The Orthodox answer on morality: conscience, the good and God",
        [
          {
            "title": "Romans 2 (KJV)",
            "url": "https://ebible.org/eng-kjv/ROM02.htm",
            "note": "Verses 14–15: the law written in the heart."
          },
          {
            "title": "St Dorotheos of Gaza, Discourses and Sayings, tr. Eric Wheeler",
            "note": "Printed book (Cistercian Publications). Discourse 3 on conscience."
          },
          {
            "title": "Tom Holland, Dominion: The Making of the Western Mind",
            "note": "Printed book (2019). An agnostic historian on how Christianity formed the moral assumptions of its critics."
          }
        ]
      ],
      [
        "Nietzsche: the death of God and what it costs",
        [
          {
            "title": "Friedrich Nietzsche, The Joyful Wisdom (The Gay Science), tr. Thomas Common (1910), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/52881",
            "note": "Public domain. Section 125, the madman, quoted in the lesson."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Friedrich Nietzsche",
            "url": "https://plato.stanford.edu/entries/nietzsche/",
            "note": "His thought, including the death of God and the critique of morality."
          }
        ]
      ],
      [
        "Nihilism after Fr Seraphim Rose: the four stages",
        [
          {
            "title": "Fr Seraphim Rose, Nihilism: The Root of the Revolution of the Modern Age",
            "note": "Printed book (1994). Summarised and paraphrased in the lesson."
          }
        ]
      ],
      [
        "The historical Jesus: did he exist?",
        [
          {
            "title": "Tacitus, Annals XV.44, tr. Church and Brodribb (1876), Perseus",
            "url": "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0078:book=15:chapter=44",
            "note": "Public domain. The passage quoted in the lesson."
          },
          {
            "title": "Josephus, Antiquities of the Jews, tr. William Whiston, Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/2848",
            "note": "Public domain. Book XX, chapter 9, on James; Book XVIII, chapter 3, the Testimonium."
          },
          {
            "title": "Bart D. Ehrman, Did Jesus Exist?",
            "note": "Printed book (2012). An agnostic scholar against the mythicists."
          }
        ]
      ],
      [
        "The Gospels as sources: reliability and the sceptical case",
        [
          {
            "title": "Richard Bauckham, Jesus and the Eyewitnesses",
            "note": "Printed book (2006; 2nd ed. 2017). The case for eyewitness testimony."
          },
          {
            "title": "Bart D. Ehrman, Jesus, Interrupted",
            "note": "Printed book (2009). The sceptical case, read as its best defender."
          }
        ]
      ],
      [
        "The resurrection: the facts and the explanations",
        [
          {
            "title": "1 Corinthians 15 (KJV)",
            "url": "https://ebible.org/eng-kjv/1CO15.htm",
            "note": "The early creed and the list of witnesses."
          },
          {
            "title": "N. T. Wright, The Resurrection of the Son of God",
            "note": "Printed book (2003). The full historical case."
          }
        ]
      ],
      [
        "The resurrection: the sceptics' replies and the Church's witness",
        [
          {
            "title": "John 20 (KJV)",
            "url": "https://ebible.org/eng-kjv/JHN20.htm",
            "note": "The empty tomb and St Thomas."
          },
          {
            "title": "Dale C. Allison, Resurrecting Jesus",
            "note": "Printed book (2005). A balanced weighing of the evidence and the sceptical replies."
          }
        ]
      ],
      [
        "Unbelief and the heart: the Fathers on why people do not believe",
        [
          {
            "title": "Fyodor Dostoevsky, The Brothers Karamazov, tr. Constance Garnett (1912), Project Gutenberg",
            "url": "https://www.gutenberg.org/ebooks/28054",
            "note": "Public domain. Book II, chapter 4: Zosima and the lady of little faith."
          },
          {
            "title": "Psalm 14 (KJV)",
            "url": "https://ebible.org/eng-kjv/PSA014.htm",
            "note": "\"The fool hath said in his heart\"."
          }
        ]
      ],
      [
        "Looking back: the answer to unbelief",
        [
          {
            "title": "John 1 (KJV)",
            "url": "https://ebible.org/eng-kjv/JHN01.htm",
            "note": "\"In the beginning was the Word\"; and Philip's \"Come and see\" (verse 46)."
          },
          {
            "title": "David Bentley Hart, Atheist Delusions: The Christian Revolution and Its Fashionable Enemies",
            "note": "Printed book (2009). An Orthodox writer on the history the New Atheists told."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 13 · Answering in practice",
    "lessons": [
      [
        "Context: from knowing the answers to giving them",
        [
          {
            "title": "1 Peter 3 (KJV)",
            "url": "https://ebible.org/eng-kjv/1PE03.htm",
            "note": "Verses 15–16, the text the stage hangs on."
          },
          {
            "title": "Acts 17 (KJV)",
            "url": "https://ebible.org/eng-kjv/ACT17.htm",
            "note": "St Paul at the Areopagus: beginning from what is shared."
          }
        ]
      ],
      [
        "Before speaking: prayer, repentance and one's own life",
        [
          {
            "title": "1 Corinthians 13 (KJV)",
            "url": "https://ebible.org/eng-kjv/1CO13.htm",
            "note": "\"Though I speak with the tongues of men and of angels, and have not charity\"."
          },
          {
            "title": "1 Corinthians 8 (KJV)",
            "url": "https://ebible.org/eng-kjv/1CO08.htm",
            "note": "\"Knowledge puffeth up, but charity edifieth.\""
          },
          {
            "title": "Little Russian Philokalia, vol. 1: St Seraphim of Sarov",
            "note": "Printed book (St Herman of Alaska Brotherhood). St Seraphim's spiritual instructions, including the spirit of peace."
          }
        ]
      ],
      [
        "Reading: St Irenaeus prays for those he answers",
        [
          {
            "title": "St Irenaeus, Against Heresies III.25, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103325.htm",
            "note": "Public domain, New Advent. Section 7 is read here."
          }
        ]
      ],
      [
        "Reading: St John Chrysostom on sheep among wolves",
        [
          {
            "title": "St John Chrysostom, Homily 33 on Matthew, tr. Prevost and Riddle (NPNF 1/10, 1888)",
            "url": "https://www.newadvent.org/fathers/200133.htm",
            "note": "Public domain, New Advent. The homily read here."
          }
        ]
      ],
      [
        "The Fathers on speaking with heretics: firmness, courtesy and the record",
        [
          {
            "title": "The Apostolic Canons, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3820.htm",
            "note": "Public domain, New Advent. Canons 27, 45 and 64."
          },
          {
            "title": "St Maximus the Confessor, The Disputation with Pyrrhus, tr. Joseph P. Farrell",
            "note": "Printed book (St Tikhon's Seminary Press). The record of the debate of 645."
          },
          {
            "title": "Titus 3 (KJV)",
            "url": "https://ebible.org/eng-kjv/TIT03.htm",
            "note": "Verse 10: admonition, then separation."
          }
        ]
      ],
      [
        "When not to argue",
        [
          {
            "title": "Proverbs 26 (KJV)",
            "url": "https://ebible.org/eng-kjv/PRO26.htm",
            "note": "Verses 4–5: answering, and not answering, a fool."
          },
          {
            "title": "2 Timothy 2 (KJV)",
            "url": "https://ebible.org/eng-kjv/2TI02.htm",
            "note": "Verses 23–26: \"the servant of the Lord must not strive\"."
          }
        ]
      ],
      [
        "A Catholic friend",
        [
          {
            "title": "Second Vatican Council, Unitatis Redintegratio (1964)",
            "url": "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_unitatis-redintegratio_en.html",
            "note": "Rome's own statement on the Orthodox churches, sections 14–18."
          },
          {
            "title": "A. Edward Siecienski, Beards, Azymes, and Purgatory: The Other Issues that Divided East and West",
            "note": "Printed book (2022). A fair, detailed account of the disputes, for a conversation that goes deep."
          }
        ]
      ],
      [
        "A Protestant family",
        [
          {
            "title": "2 Thessalonians 2 (KJV)",
            "url": "https://ebible.org/eng-kjv/2TH02.htm",
            "note": "Verse 15: \"hold the traditions... whether by word, or our epistle\"."
          },
          {
            "title": "Acts 8 (KJV)",
            "url": "https://ebible.org/eng-kjv/ACT08.htm",
            "note": "Philip and the Ethiopian: \"How can I, except some man should guide me?\""
          },
          {
            "title": "Clark Carlton, The Way: What Every Protestant Should Know about the Orthodox Church",
            "note": "Printed book (1997). Written by a former Baptist for Protestant readers."
          }
        ]
      ],
      [
        "A Muslim colleague",
        [
          {
            "title": "The Qur'an, sura 19 (Maryam), with parallel translations, quran.com",
            "url": "https://quran.com/19",
            "note": "Their own text: the sura of Mary, on the birth of Jesus."
          },
          {
            "title": "Daniel J. Janosik, John of Damascus, First Apologist to the Muslims",
            "note": "Printed book (2016). The Orthodox tradition of conversation with Islam, from its first great writer."
          }
        ]
      ],
      [
        "A Witness at the door",
        [
          {
            "title": "John 8 (KJV)",
            "url": "https://ebible.org/eng-kjv/JHN08.htm",
            "note": "Verse 58: \"Before Abraham was, I am\"."
          },
          {
            "title": "John 20 (KJV)",
            "url": "https://ebible.org/eng-kjv/JHN20.htm",
            "note": "Verse 28: Thomas's confession."
          },
          {
            "title": "St Athanasius, On the Incarnation, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent. The answer to the Arian pattern, free to offer at the door."
          }
        ]
      ],
      [
        "A convinced atheist",
        [
          {
            "title": "1 Corinthians 15 (KJV)",
            "url": "https://ebible.org/eng-kjv/1CO15.htm",
            "note": "\"If Christ be not raised, your faith is vain\": where the conversation can end."
          },
          {
            "title": "David Bentley Hart, The Experience of God",
            "note": "Printed book (2013). What the word 'God' means in the classical tradition."
          }
        ]
      ],
      [
        "The convert's questions: coming into the Church",
        [
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book (new ed. 2015). The standard first book for an enquirer."
          },
          {
            "title": "St Athanasius, On the Incarnation (NPNF 2/4)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent. A first patristic book for a convert."
          }
        ]
      ],
      [
        "Losing well: when you have no answer, and when you are wrong",
        [
          {
            "title": "John 20 (KJV)",
            "url": "https://ebible.org/eng-kjv/JHN20.htm",
            "note": "Verses 24–29: Thomas's doubt, and Christ meeting it."
          },
          {
            "title": "Acts 17 (KJV)",
            "url": "https://ebible.org/eng-kjv/ACT17.htm",
            "note": "Verses 32–34: most mocked, \"howbeit certain men clave unto him\"."
          }
        ]
      ],
      [
        "Looking back: the whole of Polemics",
        [
          {
            "title": "St Irenaeus, Against Heresies III.25 (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0103325.htm",
            "note": "Public domain, New Advent. Prayer for those answered."
          },
          {
            "title": "St John Chrysostom, Homily 33 on Matthew (NPNF 1/10)",
            "url": "https://www.newadvent.org/fathers/200133.htm",
            "note": "Public domain, New Advent. The sheep among wolves."
          }
        ]
      ]
    ]
  }
];

const out = [
  '-- Generated by scripts/curriculums/polemics.mjs. Read before running.',
  '-- Apply it with `npm run curriculum polemics`, which carries ticks,',
  "-- detail typed at the dashboard and every card's review history across the",
  '-- rebuild below. Running this file through wrangler by hand discards them.',
  // Rebuildable without losing its place: the row is created only if it is not
  // already there, and its modules are cleared instead. Deleting the curriculum
  // and reinserting it would take a new position at the end, and curriculum
  // order IS the route through all the routes.
  `insert into curriculums (name, source, status, position, created_at, audience)\n` +
    `  select ${q(NAME)}, ${q(SOURCE)}, 'active',\n` +
    `    (select coalesce(max(position), 0) + 1 from curriculums), ${q(NOW)}, 'his'\n` +
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
for (const key of strayDetail) console.error(`! polemics-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! polemics-cards.json has no lesson: ${key}`);

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
