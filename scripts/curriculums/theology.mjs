// Theology — Orthodox, pan-Orthodox and with no writer excluded. The
// plan and every ruling are in scripts/curriculums/theology.md; this file is
// the structure. The material is in theology-detail.json and the cards in
// theology-cards.json, keyed by lesson name.
//
//   npm run curriculum theology       # the live database
//
// THE RULE FOR THIS ONE: taught as the Church teaches it; where Orthodox writers
// genuinely differ, each view in its strongest form. No polemics. Quotations
// come only from public-domain translations fetched and checked word for word;
// anything in copyright is paraphrased and says so.

import detail from './theology-detail.json' with { type: 'json' };
import cards from './theology-cards.json' with { type: 'json' };

const SOURCE = 'scripts/curriculums/theology.md';
const NAME = 'Theology';

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
    "name": "Stage 1 · How the Church knows",
    "lessons": [
      [
        "Context: what Orthodox theology is and where it comes from",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Sources of Christian Doctrine (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/revelation",
            "note": "Free on oca.org. The OCA's catechism; this section introduces revelation and the witnesses to it."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book. Metropolitan Kallistos Ware's standard introduction; Part II begins with Holy Tradition."
          }
        ]
      ],
      [
        "The theologian is one who prays: theology as prayer",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Orthodox Spirituality (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality",
            "note": "Free on oca.org. Prayer and the knowledge of God."
          },
          {
            "title": "The Philokalia, vol. 1, tr. G. E. H. Palmer, Philip Sherrard and Kallistos Ware",
            "note": "Printed book (in copyright). Contains 'On Prayer' under the name of St Nilus; the source of the paraphrased saying."
          }
        ]
      ],
      [
        "Purity of heart: why Gregory says not everyone may theologise",
        [
          {
            "title": "St Gregory of Nazianzus, First Theological Oration (Oration 27), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310227.htm",
            "note": "Public domain, New Advent. The passage read here is section 3."
          },
          {
            "title": "OCA: Saint Gregory the Theologian, Archbishop of Constantinople",
            "url": "https://www.oca.org/saints/lives/2026/01/25/100298-saint-gregory-the-theologian-archbishop-of-constantinople",
            "note": "The OCA's life of the saint, 25 January."
          }
        ]
      ],
      [
        "Revelation: how God makes himself known",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Revelation (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/revelation",
            "note": "Free on oca.org."
          },
          {
            "title": "Vladimir Lossky, The Mystical Theology of the Eastern Church",
            "note": "Printed book. Chapter 1 on theology and mysticism in the Eastern tradition."
          }
        ]
      ],
      [
        "Holy Tradition: what is handed down",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Tradition (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/tradition",
            "note": "Free on oca.org."
          },
          {
            "title": "Vladimir Lossky, In the Image and Likeness of God",
            "note": "Printed book. Contains Lossky's essay 'Tradition and Traditions'."
          }
        ]
      ],
      [
        "Scripture within Tradition",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Bible (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/bible1",
            "note": "Free on oca.org."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Interpretation of the Bible (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-bible/interpretation",
            "note": "Free on oca.org. How the Church reads Scripture."
          },
          {
            "title": "St Athanasius, Festal Letter 39 (367), tr. R. Payne-Smith (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2806039.htm",
            "note": "Public domain, New Advent. The earliest list of exactly the 27 New Testament books."
          }
        ]
      ],
      [
        "St Basil on the written and unwritten traditions",
        [
          {
            "title": "St Basil, On the Holy Spirit, tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/3203.htm",
            "note": "Public domain, New Advent. Chapter 27 is read here."
          },
          {
            "title": "OCA: Saint Basil the Great, Archbishop of Caesarea in Cappadocia",
            "url": "https://www.oca.org/saints/lives/2026/01/01/100003-saint-basil-the-great-archbishop-of-caesarea-in-cappadocia",
            "note": "The OCA's life of the saint, 1 January."
          }
        ]
      ],
      [
        "Faith and reason: theology and philosophy",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Fathers (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-fathers",
            "note": "Free on oca.org."
          },
          {
            "title": "John Meyendorff, Byzantine Theology",
            "note": "Printed book. On how the Byzantine Fathers used and limited philosophy."
          }
        ]
      ],
      [
        "The seven ecumenical councils as witnesses",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Councils (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-councils",
            "note": "Free on oca.org."
          },
          {
            "title": "The Seven Ecumenical Councils, ed. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.ccel.org/ccel/schaff/npnf214.html",
            "note": "Public domain, CCEL. The definitions and canons of all seven councils."
          }
        ]
      ],
      [
        "Reception: how a council is known to be ecumenical",
        [
          {
            "title": "OCA: Saint Mark, Archbishop of Ephesus",
            "url": "https://www.oca.org/saints/lives/2026/01/19/100228-saint-mark-archbishop-of-ephesus",
            "note": "The OCA's life of the saint who refused the union of Florence."
          },
          {
            "title": "Leo Donald Davis, The First Seven Ecumenical Councils (325–787)",
            "note": "Printed book. The history of each council, including the councils that were rejected."
          }
        ]
      ],
      [
        "Who counts as a Father of the Church",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Fathers (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-fathers",
            "note": "Free on oca.org."
          },
          {
            "title": "OCA: Venerable Macrina, sister of Saint Basil the Great",
            "url": "https://www.oca.org/saints/lives/2026/07/19/102055-venerable-macrina-sister-of-saint-basil-the-great",
            "note": "The OCA's life of St Macrina, 19 July."
          }
        ]
      ],
      [
        "The consensus of the Fathers",
        [
          {
            "title": "The Definition of Faith of Chalcedon, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3811.htm",
            "note": "Public domain, New Advent. Opens 'Following the holy Fathers'."
          },
          {
            "title": "Georges Florovsky, Bible, Church, Tradition: An Eastern Orthodox View (Collected Works, vol. 1)",
            "note": "Printed book. Florovsky's essays on Tradition and the mind of the Fathers."
          }
        ]
      ],
      [
        "Reading: St Vincent of Lérins on what has been believed everywhere, always, by all",
        [
          {
            "title": "St Vincent of Lérins, Commonitorium, tr. C. A. Heurtley (NPNF 2/11, 1894)",
            "url": "https://www.newadvent.org/fathers/3506.htm",
            "note": "Public domain, New Advent. The passage read here is chapter 2."
          },
          {
            "title": "NPNF 2nd series, vol. 11 (Sulpitius Severus, Vincent of Lérins, John Cassian)",
            "url": "https://www.ccel.org/ccel/schaff/npnf211.html",
            "note": "Public domain, CCEL. The same translation in the full volume."
          },
          {
            "title": "OCA: Saint Vincent of Lérins",
            "url": "https://www.oca.org/saints/lives/2026/05/24/101530-saint-vincent-of-lerins",
            "note": "The OCA's life of the saint, 24 May."
          }
        ]
      ],
      [
        "Growth without change: St Vincent on development",
        [
          {
            "title": "St Vincent of Lérins, Commonitorium, tr. C. A. Heurtley (NPNF 2/11, 1894)",
            "url": "https://www.newadvent.org/fathers/3506.htm",
            "note": "Public domain, New Advent. Chapter 23, 'On Development in Religious Knowledge'."
          }
        ]
      ],
      [
        "The services as theology: the rule of prayer",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Liturgy (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-liturgy",
            "note": "Free on oca.org."
          },
          {
            "title": "Alexander Schmemann, Introduction to Liturgical Theology",
            "note": "Printed book. The classic Orthodox study of worship as the Church's theology."
          }
        ]
      ],
      [
        "Icons and the lives of the saints as witnesses",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Church Art (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/church-art",
            "note": "Free on oca.org."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Saints (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-saints",
            "note": "Free on oca.org."
          },
          {
            "title": "The Second Council of Nicaea (787), tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3819.htm",
            "note": "Public domain, New Advent. The council's definition on icons."
          }
        ]
      ],
      [
        "The holy canons: akriveia and oikonomia",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Canons (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/canons",
            "note": "Free on oca.org."
          },
          {
            "title": "OCA: Repose of Venerable Nikodemos the Hagiorite",
            "url": "https://www.oca.org/saints/lives/2026/07/14/102028-repose-of-venerable-nikodemos-the-hagiorite",
            "note": "The OCA's life of the compiler of the Pedalion, 14 July."
          },
          {
            "title": "The Rudder (Pedalion), tr. D. Cummings (1957)",
            "note": "Printed book. The English translation of St Nikodemos' and Agapios' collection of the canons."
          }
        ]
      ],
      [
        "Dogma, theologoumenon and private opinion",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Sources of Christian Doctrine (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/tradition",
            "note": "Free on oca.org. On the weight of the different witnesses."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Way",
            "note": "Printed book. Metropolitan Kallistos on mystery and dogma."
          }
        ]
      ],
      [
        "Bishops and apostolic succession: Ignatius and Irenaeus",
        [
          {
            "title": "St Ignatius, Letter to the Smyrnaeans, tr. Roberts and Donaldson (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0109.htm",
            "note": "Public domain, New Advent. Chapter 8 is quoted."
          },
          {
            "title": "St Irenaeus, Against Heresies 3.3, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103303.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "OCA: Hieromartyr Irenaeus, Bishop of Lyons",
            "url": "https://www.oca.org/saints/lives/2026/08/23/102379-hieromartyr-irenaeus-bishop-of-lyons",
            "note": "The OCA's life of the saint, 23 August."
          }
        ]
      ],
      [
        "The mind of the Church: phronema and the whole people of God",
        [
          {
            "title": "Encyclical of the Eastern Patriarchs, 1848 (Orthodox Christian Information Center)",
            "url": "https://orthodoxinfo.com/ecumenism/encyc_1848.aspx",
            "note": "An English translation of the full encyclical, including the sentence on the people as guardian of the faith that the lesson paraphrases."
          },
          {
            "title": "St Irenaeus, Against Heresies 1.10, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103110.htm",
            "note": "Public domain, New Advent. The Church throughout the world keeping one faith 'as if occupying but one house'."
          }
        ]
      ],
      [
        "The Church in one map: the patriarchates and autocephalous churches",
        [
          {
            "title": "Wikipedia: Organization of the Eastern Orthodox Church",
            "url": "https://en.wikipedia.org/wiki/Eastern_Orthodox_Church_organization",
            "note": "Free. A current list of the autocephalous and autonomous churches; check disputed points against Stage 11 and 12."
          },
          {
            "title": "Wikipedia: Autocephaly",
            "url": "https://en.wikipedia.org/wiki/Autocephaly",
            "note": "Free. The term and the dates at which each church received it."
          }
        ]
      ],
      [
        "Looking back: how the Church knows",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Doctrine and Scripture (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture",
            "note": "Free on oca.org. The whole first volume, for review."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 2 · The Creed: God and the Trinity",
    "lessons": [
      [
        "Context: the Creed and why the Church says it",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Nicene Creed (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/nicene-creed",
            "note": "Free on oca.org. The opening of Hopko's commentary on the Creed."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the liturgical texts quoted."
          }
        ]
      ],
      [
        "The Symbol of Faith: the text of Nicaea and Constantinople",
        [
          {
            "title": "First Council of Constantinople (381): the Creed, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3808.htm",
            "note": "Public domain, New Advent. The text quoted."
          },
          {
            "title": "First Council of Nicaea (325): the Creed, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3801.htm",
            "note": "Public domain, New Advent. For comparing the two texts."
          }
        ]
      ],
      [
        "Faith: what \"I believe\" means",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Faith (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/faith",
            "note": "Free on oca.org."
          },
          {
            "title": "St Basil, Letter 234, tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/3202234.htm",
            "note": "Public domain, New Advent. On knowing God by faith."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the liturgical texts quoted."
          }
        ]
      ],
      [
        "Can God be known? Creation, conscience and revelation",
        [
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 1, tr. Watson and Pullan (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33041.htm",
            "note": "Public domain, New Advent. Chapters 1–3 on the knowledge of God and proofs of His existence."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: God (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/god",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "One God: the faith of Israel and the Church",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: One God, One Divine Nature and Being (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/one-god-one-divine-nature-and-being",
            "note": "Free on oca.org."
          },
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 1 (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33041.htm",
            "note": "Public domain, New Advent. Chapter 5, that God is one and not many."
          }
        ]
      ],
      [
        "God the Father: the monarchy of the Father",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: One God, One Father (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/one-god-one-father",
            "note": "Free on oca.org."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the liturgical texts quoted."
          }
        ]
      ],
      [
        "Almighty: God the Pantokrator",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: God (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/god",
            "note": "Free on oca.org. On 'the Father Almighty'."
          },
          {
            "title": "Gregory of Nyssa: Dogmatic Treatises (NPNF 2/5)",
            "url": "https://www.ccel.org/ccel/schaff/npnf205.html",
            "note": "Public domain, CCEL. Includes the Catechetical Oration (The Great Catechism); chapter 24 on God's power shown in humility."
          }
        ]
      ],
      [
        "The divine Name: \"I am THE BEING\"",
        [
          {
            "title": "Brenton's Septuagint (1851), Exodus 3",
            "url": "https://ebible.org/eng-Brenton/EXO03.htm",
            "note": "Public domain, eBible.org. The text quoted."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: God (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/god",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "The Trinity revealed: Scripture, the Theophany and Abraham's guests",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Holy Trinity Revealed (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/the-holy-trinity-revealed",
            "note": "Free on oca.org."
          },
          {
            "title": "OCA: Feast of the Theophany of Our Lord and Savior Jesus Christ",
            "url": "https://www.oca.org/saints/lives/2026/01/06/100106-feast-of-the-theophany-of-our-lord-and-savior-jesus-christ",
            "note": "The OCA's page on the feast, 6 January."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the liturgical texts quoted."
          }
        ]
      ],
      [
        "Ousia and hypostasis: the words for one and three",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Doctrine of the Holy Trinity (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/the-doctrine-of-the-holy-trinity",
            "note": "Free on oca.org."
          },
          {
            "title": "Gregory of Nyssa: Dogmatic Treatises (NPNF 2/5)",
            "url": "https://www.ccel.org/ccel/schaff/npnf205.html",
            "note": "Public domain, CCEL. Contains 'On \"Not Three Gods\"' to Ablabius."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Trinity",
            "url": "https://plato.stanford.edu/entries/trinity/",
            "note": "Free. The philosophical discussion of the doctrine, for comparison."
          }
        ]
      ],
      [
        "Homoousios: of one essence with the Father",
        [
          {
            "title": "First Council of Nicaea (325): the Creed and canons, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3801.htm",
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
        "The Cappadocian Fathers and the settlement of 381",
        [
          {
            "title": "OCA: Synaxis of the Ecumenical Teachers and Hierarchs Basil the Great, Gregory the Theologian and John Chrysostom",
            "url": "https://www.oca.org/saints/lives/2026/01/30/100350-synaxis-of-the-ecumenical-teachers-and-hierarchs-basil-the-great",
            "note": "The OCA's page for 30 January."
          },
          {
            "title": "OCA: Saint Gregory, Bishop of Nyssa",
            "url": "https://www.oca.org/saints/lives/2026/01/10/100140-saint-gregory-bishop-of-nyssa",
            "note": "The OCA's life of the saint, 10 January."
          },
          {
            "title": "John Behr, The Nicene Faith (The Formation of Christian Theology, vol. 2)",
            "note": "Printed book. Fr John Behr's account of the fourth-century settlement."
          }
        ]
      ],
      [
        "Begotten and proceeding: what distinguishes the Three",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Three Divine Persons (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/the-three-divine-persons",
            "note": "Free on oca.org."
          },
          {
            "title": "St Gregory of Nazianzus, Fifth Theological Oration (Oration 31), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310231.htm",
            "note": "Public domain, New Advent. Section 8 on procession is quoted."
          }
        ]
      ],
      [
        "Reading: St Gregory the Theologian, Third Theological Oration 2–3",
        [
          {
            "title": "St Gregory of Nazianzus, Third Theological Oration (Oration 29), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310229.htm",
            "note": "Public domain, New Advent. The text read here."
          },
          {
            "title": "NPNF 2nd series, vol. 7 (Cyril of Jerusalem, Gregory Nazianzen)",
            "url": "https://www.ccel.org/ccel/schaff/npnf207.html",
            "note": "Public domain, CCEL. The same translation with notes."
          }
        ]
      ],
      [
        "One will, one action: perichoresis and the indivisible Trinity",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: One God, One Divine Action and Will (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/one-god-one-divine-action-and-will",
            "note": "Free on oca.org."
          },
          {
            "title": "St Gregory of Nazianzus, Oration 40, On Holy Baptism, tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310240.htm",
            "note": "Public domain, New Advent. Section 41 is quoted."
          }
        ]
      ],
      [
        "The procession of the Holy Spirit and the filioque, in brief",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Holy Spirit (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/holy-spirit",
            "note": "Free on oca.org."
          },
          {
            "title": "A. Edward Siecienski, The Filioque: History of a Doctrinal Controversy",
            "note": "Printed book. A full history of the question, used here only for the dates."
          }
        ]
      ],
      [
        "Errors the Church rejected about the Trinity",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Wrong Doctrines of the Trinity (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/wrong-doctrines-of-the-trinity",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "Apophatic theology: knowing God by unknowing",
        [
          {
            "title": "St Gregory of Nazianzus, Second Theological Oration (Oration 28), tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310228.htm",
            "note": "Public domain, New Advent. Section 4 is quoted."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Pseudo-Dionysius the Areopagite",
            "url": "https://plato.stanford.edu/entries/pseudo-dionysius-areopagite/",
            "note": "Free. Dionysius' negative theology as philosophy."
          },
          {
            "title": "Vladimir Lossky, The Mystical Theology of the Eastern Church",
            "note": "Printed book. Chapter 2, 'The Divine Darkness'."
          }
        ]
      ],
      [
        "Cataphatic theology: the names of God",
        [
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 1 (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33041.htm",
            "note": "Public domain, New Advent. Chapters 4, 9 and 11–12 on what is affirmed about God."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Pseudo-Dionysius the Areopagite",
            "url": "https://plato.stanford.edu/entries/pseudo-dionysius-areopagite/",
            "note": "Free. On The Divine Names."
          }
        ]
      ],
      [
        "Essence and energies: God unknown and known",
        [
          {
            "title": "St Basil, Letter 234, tr. Blomfield Jackson (NPNF 2/8, 1895)",
            "url": "https://www.newadvent.org/fathers/3202234.htm",
            "note": "Public domain, New Advent. The passage on essence and operations is quoted."
          },
          {
            "title": "OCA: Saint Gregory Palamas, Archbishop of Thessalonica",
            "url": "https://www.oca.org/saints/lives/2026/11/14/103303-saint-gregory-palamas-archbishop-of-thessalonica",
            "note": "The OCA's life of the saint, 14 November."
          },
          {
            "title": "John Meyendorff, A Study of Gregory Palamas",
            "note": "Printed book. The standard study of Palamas' teaching."
          }
        ]
      ],
      [
        "Creation from nothing",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Creation (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/creation",
            "note": "Free on oca.org."
          },
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 1 (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33041.htm",
            "note": "Public domain, New Advent. Chapter 8 on begetting and creating is quoted."
          }
        ]
      ],
      [
        "Created and uncreated: the great divide",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Holy Trinity in Creation (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/the-holy-trinity-in-creation",
            "note": "Free on oca.org."
          },
          {
            "title": "Georges Florovsky, Creation and Redemption (Collected Works, vol. 3)",
            "note": "Printed book. Includes Florovsky's essay on the idea of creation in the Fathers."
          }
        ]
      ],
      [
        "The invisible creation: the angels",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Angels and Evil Spirits (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/angels-and-evil-spirits",
            "note": "Free on oca.org."
          },
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 2 (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33042.htm",
            "note": "Public domain, New Advent. Chapter 3 on angels is quoted."
          },
          {
            "title": "OCA: Synaxis of the Archangel Michael and the Other Bodiless Powers",
            "url": "https://www.oca.org/saints/lives/2026/11/08/103244-synaxis-of-the-archangel-michael-and-the-other-bodiless-powers",
            "note": "The OCA's page for 8 November."
          }
        ]
      ],
      [
        "The human person: made in the image and likeness of God",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Man (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/man",
            "note": "Free on oca.org."
          },
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 2 (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33042.htm",
            "note": "Public domain, New Advent. Chapter 12 on man is quoted."
          },
          {
            "title": "Brenton's Septuagint (1851), Genesis 1",
            "url": "https://ebible.org/eng-Brenton/GEN01.htm",
            "note": "Public domain, eBible.org."
          }
        ]
      ],
      [
        "Providence: God's care for his creation",
        [
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 2 (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33042.htm",
            "note": "Public domain, New Advent. Chapters 29–30 on providence and foreknowledge."
          },
          {
            "title": "Stanford Encyclopedia of Philosophy: Divine Providence",
            "url": "https://plato.stanford.edu/entries/providence-divine/",
            "note": "Free. The philosophical questions, for comparison."
          }
        ]
      ],
      [
        "Looking back: God and the Trinity",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: The Doctrine of the Holy Trinity (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-holy-trinity/the-doctrine-of-the-holy-trinity",
            "note": "Free on oca.org. For review."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 3 · The Creed: Christ",
    "lessons": [
      [
        "Context: the second article of the Creed",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Jesus Christ (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/jesus-christ",
            "note": "Free on oca.org."
          },
          {
            "title": "First Council of Constantinople (381): the Creed, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3808.htm",
            "note": "Public domain, New Advent. The text quoted."
          }
        ]
      ],
      [
        "The fall: what happened in Paradise",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Sin (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/sin",
            "note": "Free on oca.org."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Sin (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/sin1",
            "note": "Free on oca.org. The fall in the spiritual life."
          }
        ]
      ],
      [
        "Ancestral sin: what we inherit from Adam",
        [
          {
            "title": "John S. Romanides, The Ancestral Sin, tr. George Gabriel",
            "note": "Printed book. The English translation of Romanides' 1957 dissertation."
          },
          {
            "title": "John Meyendorff, Byzantine Theology",
            "note": "Printed book. Chapter on man, with the reading of Romans 5:12."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Sin (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/sin",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "Death and corruption: St Athanasius on the human plight",
        [
          {
            "title": "St Athanasius, On the Incarnation of the Word, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Man (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/man",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "The promise: Christ foretold in the Old Testament",
        [
          {
            "title": "Brenton's Septuagint (1851), Genesis 3",
            "url": "https://ebible.org/eng-Brenton/GEN03.htm",
            "note": "Public domain, eBible.org. Genesis 3:15 quoted."
          },
          {
            "title": "Brenton's Septuagint (1851), Isaiah 7",
            "url": "https://ebible.org/eng-Brenton/ISA07.htm",
            "note": "Public domain, eBible.org. Isaiah 7:14 quoted."
          }
        ]
      ],
      [
        "\"One Lord Jesus Christ\": the names and titles of Christ",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Jesus Christ (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/jesus-christ",
            "note": "Free on oca.org."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Christ (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/christ",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "The eternal Word: \"In the beginning was the Word\"",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Son of God (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/son-of-god",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "\"Was incarnate and was made man\": the Incarnation",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Incarnation (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/incarnation",
            "note": "Free on oca.org."
          },
          {
            "title": "St Gregory of Nazianzus, Oration 38, On the Theophany or Birthday of Christ, tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310238.htm",
            "note": "Public domain, New Advent. The opening is quoted."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the hymns quoted."
          }
        ]
      ],
      [
        "Why God became man: St Athanasius and St Irenaeus",
        [
          {
            "title": "St Irenaeus, Against Heresies 3.19, tr. Roberts and Rambaut (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103319.htm",
            "note": "Public domain, New Advent. Section 1 is quoted."
          },
          {
            "title": "St Irenaeus, Against Heresies Book 5, preface (ANF 1, 1885)",
            "url": "https://www.newadvent.org/fathers/0103500.htm",
            "note": "Public domain, New Advent. 'Become what we are, that He might bring us to be even what He is Himself.'"
          },
          {
            "title": "St Athanasius, On the Incarnation of the Word, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "Reading: St Athanasius, On the Incarnation 8 and 54",
        [
          {
            "title": "St Athanasius, On the Incarnation of the Word, tr. Archibald Robertson (NPNF 2/4, 1892)",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "NPNF 2nd series, vol. 4 (Athanasius: Select Works and Letters)",
            "url": "https://www.ccel.org/ccel/schaff/npnf204.html",
            "note": "Public domain, CCEL. The same translation with Robertson's introduction and notes."
          },
          {
            "title": "OCA: Saint Athanasius the Great, Patriarch of Alexandria",
            "url": "https://www.oca.org/saints/lives/2026/05/02/101269-saint-athanasius-the-great-patriarch-of-alexandria",
            "note": "The OCA's life of the saint, 2 May."
          }
        ]
      ],
      [
        "Truly God: the divinity of Christ",
        [
          {
            "title": "Second Council of Constantinople (553): the anathemas, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3812.htm",
            "note": "Public domain, New Advent. The tenth anathema is quoted."
          },
          {
            "title": "St Gregory of Nazianzus, Third Theological Oration (Oration 29) (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310229.htm",
            "note": "Public domain, New Advent. Sections 19–20 set Christ's human and divine acts side by side."
          }
        ]
      ],
      [
        "Truly man: a human body, soul and mind",
        [
          {
            "title": "St Gregory of Nazianzus, Letter 101 to Cledonius, tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/3103a.htm",
            "note": "Public domain, New Advent. 'That which He has not assumed He has not healed.'"
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Incarnation (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/incarnation",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "The Theotokos: Ephesus (431) and the Mother of God",
        [
          {
            "title": "Council of Ephesus (431), with Cyril's anathemas, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3810.htm",
            "note": "Public domain, New Advent. The first anathema is quoted."
          },
          {
            "title": "OCA: Saint Cyril, Archbishop of Alexandria",
            "url": "https://www.oca.org/saints/lives/2026/06/09/101595-saint-cyril-archbishop-of-alexandria",
            "note": "The OCA's life of the saint, 9 June."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the hymns quoted."
          }
        ]
      ],
      [
        "The Ever-Virgin Mary in Orthodox teaching and prayer",
        [
          {
            "title": "OCA: The Dormition of Our Most Holy Lady the Mother of God and Ever-Virgin Mary",
            "url": "https://www.oca.org/saints/lives/2026/08/15/102302-the-dormition-of-our-most-holy-lady-the-mother-of-god-and-ever-v",
            "note": "The OCA's page on the feast, 15 August."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 2: The Dormition of the Theotokos (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/dormition-of-the-theotokos",
            "note": "Free on oca.org."
          },
          {
            "title": "OCA: The Nativity of Our Most Holy Lady the Mother of God and Ever-Virgin Mary",
            "url": "https://www.oca.org/saints/lives/2026/09/08/102541-the-nativity-of-our-most-holy-lady-the-mother-of-god-and-ever-vi",
            "note": "The OCA's page on the feast, 8 September."
          }
        ]
      ],
      [
        "The Definition of Chalcedon (451): one person in two natures",
        [
          {
            "title": "Council of Chalcedon (451): the Definition of Faith, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3811.htm",
            "note": "Public domain, New Advent. The text quoted."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Jesus Christ (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/jesus-christ",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "The hypostatic union and the exchange of properties",
        [
          {
            "title": "Second Council of Constantinople (553): the anathemas (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3812.htm",
            "note": "Public domain, New Advent. The fifth anathema is quoted."
          },
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book 3 (NPNF 2/9, 1899)",
            "url": "https://www.newadvent.org/fathers/33043.htm",
            "note": "Public domain, New Advent. The Damascene's chapters on the Incarnation and the exchange of properties."
          }
        ]
      ],
      [
        "Two wills and two energies: St Maximus and Constantinople III (681)",
        [
          {
            "title": "Third Council of Constantinople (680–681): the Definition, tr. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.newadvent.org/fathers/3813.htm",
            "note": "Public domain, New Advent. The text quoted."
          },
          {
            "title": "OCA: Venerable Maximus the Confessor",
            "url": "https://www.oca.org/saints/lives/2026/01/21/100249-venerable-maximus-the-confessor",
            "note": "The OCA's life of the saint, 21 January."
          },
          {
            "title": "Andrew Louth, Maximus the Confessor",
            "note": "Printed book. Introduction and translated texts."
          }
        ]
      ],
      [
        "Christ revealed: the Nativity and the Transfiguration",
        [
          {
            "title": "OCA: The Holy Transfiguration of Our Lord God and Savior Jesus Christ",
            "url": "https://www.oca.org/saints/lives/2026/08/06/102215-the-holy-transfiguration-of-our-lord-god-and-savior-jesus-christ",
            "note": "The OCA's page on the feast, 6 August."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 2: The Nativity of Christ (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/nativity-of-christ",
            "note": "Free on oca.org."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the hymns quoted."
          }
        ]
      ],
      [
        "The Cross: the voluntary Passion",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 2: Holy Friday (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/holy-friday",
            "note": "Free on oca.org."
          },
          {
            "title": "OCA: The Universal Exaltation of the Precious and Life-Giving Cross",
            "url": "https://www.oca.org/saints/lives/2026/09/14/102610-the-universal-exaltation-of-the-precious-and-life-giving-cross",
            "note": "The OCA's page on the feast, 14 September."
          }
        ]
      ],
      [
        "Ransom, sacrifice, victory and healing: how the Church speaks of salvation",
        [
          {
            "title": "St Gregory of Nazianzus, Oration 45, The Second Oration on Easter, tr. Browne and Swallow (NPNF 2/7, 1894)",
            "url": "https://www.newadvent.org/fathers/310245.htm",
            "note": "Public domain, New Advent. Section 22 is quoted."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Redemption (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/redemption",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "The descent into Hades",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 2: Holy Saturday (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/holy-saturday",
            "note": "Free on oca.org."
          },
          {
            "title": "OCA: Great and Holy Saturday",
            "url": "https://www.oca.org/saints/lives/2026/04/11/26-great-and-holy-saturday",
            "note": "The OCA's page for Holy Saturday (2026 date)."
          }
        ]
      ],
      [
        "The Resurrection on the third day",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Resurrection (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/resurrection",
            "note": "Free on oca.org."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 2: Easter Sunday, the Holy Pascha (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/easter-sunday-the-holy-pascha",
            "note": "Free on oca.org."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the hymns quoted."
          }
        ]
      ],
      [
        "Salvation in Orthodox teaching: grace, freedom and synergy",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Redemption (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/redemption",
            "note": "Free on oca.org."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 4: Spirituality (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/spirituality",
            "note": "Free on oca.org."
          }
        ]
      ],
      [
        "Theosis: becoming by grace what God is by nature",
        [
          {
            "title": "Norman Russell, Fellow Workers with God: Orthodox Thinking on Theosis",
            "note": "Printed book. A short introduction by an Orthodox scholar."
          },
          {
            "title": "OCA: Repose of Venerable Seraphim, Wonderworker of Sarov",
            "url": "https://www.oca.org/saints/lives/2026/01/02/100008-repose-of-venerable-seraphim-wonderworker-of-sarov",
            "note": "The OCA's life of the saint, 2 January."
          }
        ]
      ],
      [
        "Theosis without confusion: union with God by the energies",
        [
          {
            "title": "Vladimir Lossky, The Mystical Theology of the Eastern Church",
            "note": "Printed book. Chapters on the divine energies and the way of union."
          },
          {
            "title": "OCA: Venerable Silouan of Mount Athos",
            "url": "https://www.oca.org/saints/lives/2026/09/24/102722-venerable-silouan-of-mount-athos",
            "note": "The OCA's life of the saint, 24 September."
          }
        ]
      ],
      [
        "Christ the Prophet, Priest and King",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Jesus Christ (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/jesus-christ",
            "note": "Free on oca.org."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the hymns quoted."
          }
        ]
      ],
      [
        "The Ascension and the Second Coming",
        [
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Ascension (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/ascension",
            "note": "Free on oca.org."
          },
          {
            "title": "Fr Thomas Hopko, The Orthodox Faith, vol. 1: Judgment (OCA)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/judgment",
            "note": "Free on oca.org."
          },
          {
            "title": "Isabel Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain, Internet Archive. The source of the hymns quoted."
          }
        ]
      ],
      [
        "Looking back: Christ",
        [
          {
            "title": "The Seven Ecumenical Councils, ed. Henry Percival (NPNF 2/14, 1900)",
            "url": "https://www.ccel.org/ccel/schaff/npnf214.html",
            "note": "Public domain, CCEL. The definitions of all the councils, for review."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 4 · The Creed: the Spirit, the Church and the life to come",
    "lessons": [
      [
        "Context: the third part of the Creed",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Nicene Creed",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/nicene-creed",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org (Cornell copy)."
          }
        ]
      ],
      [
        "The Holy Spirit in the Creed: \"the Lord, the Giver of life\"",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Holy Spirit",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/holy-spirit",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Basil, On the Holy Spirit, tr. Blomfield Jackson (NPNF II.8)",
            "url": "https://www.newadvent.org/fathers/3203.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "The Spirit in the Old Testament and the Gospels",
        [
          {
            "title": "St Gregory of Nazianzus, Oration 31 (Fifth Theological Oration), tr. Browne and Swallow (NPNF II.7)",
            "url": "https://www.newadvent.org/fathers/310231.htm",
            "note": "Public domain, New Advent. §26 is the passage on revelation in stages."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Holy Spirit",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/holy-spirit",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Pentecost: the feast and the event",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Pentecost, the Descent of the Holy Spirit",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/pentecost-the-descent-of-the-holy-spirit",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Acts 2, King James Version (ebible.org)",
            "url": "https://ebible.org/eng-kjv/ACT02.htm",
            "note": "Public domain."
          }
        ]
      ],
      [
        "The procession of the Spirit and the filioque",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Holy Spirit",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/holy-spirit",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The Ninth Century",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/ninth-century",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online. St Photios and the filioque dispute."
          }
        ]
      ],
      [
        "Acquiring the Holy Spirit: gifts and fruits",
        [
          {
            "title": "OCA: Repose of Venerable Seraphim, Wonderworker of Sarov",
            "url": "https://www.oca.org/saints/lives/2026/01/02/100008-repose-of-venerable-seraphim-wonderworker-of-sarov",
            "note": "The OCA's life of St Seraphim, with the Motovilov conversation."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Prayer in the Spirit",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/prayer-in-the-spirit",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Reading: St Basil, On the Holy Spirit 9, the Spirit like sunlight",
        [
          {
            "title": "St Basil, On the Holy Spirit, ch. 9, tr. Blomfield Jackson (NPNF II.8), CCEL",
            "url": "https://ccel.org/ccel/schaff/npnf208.vii.x.html",
            "note": "Public domain; the 1895 text with Jackson's notes. The quotation is taken from here."
          },
          {
            "title": "St Basil, On the Holy Spirit (whole treatise), New Advent",
            "url": "https://www.newadvent.org/fathers/3203.htm",
            "note": "Public domain, lightly modernised by New Advent."
          }
        ]
      ],
      [
        "The Church as the Body of Christ",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Church",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/church",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Irenaeus, Against Heresies III.24, tr. Roberts and Rambaut (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0103324.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "St Cyprian, On the Unity of the Church, tr. Wallis (ANF 5)",
            "url": "https://www.newadvent.org/fathers/050701.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "One, holy, catholic and apostolic: the four marks of the Church",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Church",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/church",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Ignatius of Antioch, To the Smyrnaeans, tr. Roberts and Donaldson (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0109.htm",
            "note": "Public domain, New Advent. §8 is the first use of \"Catholic Church\"."
          }
        ]
      ],
      [
        "Bishops, apostolic succession and the eucharistic assembly",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Orders",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/holy-orders",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Ignatius of Antioch, To the Smyrnaeans, tr. Roberts and Donaldson (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0109.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "Conciliarity: sobornost and the councils",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Councils",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-councils",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Alexei Khomiakov, The Church Is One",
            "note": "Printed essay by Khomiakov (written 1840s); many editions."
          }
        ]
      ],
      [
        "The Mysteries: what a sacrament is in Orthodox teaching",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Sacraments",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/the-sacraments",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Sacraments (in the Symbol of Faith)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/sacraments",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "How many Mysteries? Seven, and the sacramental life",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Sacraments",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/the-sacraments",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Alexander Schmemann, For the Life of the World",
            "note": "Printed book by Schmemann (1963) on the sacramental life."
          }
        ]
      ],
      [
        "Baptism: dying and rising with Christ",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Baptism",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/baptism",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Alexander Schmemann, Of Water and the Spirit",
            "note": "Printed book by Schmemann (1974) on baptism and chrismation."
          }
        ]
      ],
      [
        "The rite of baptism step by step",
        [
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org (Cornell copy)."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Baptism",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/baptism",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Chrismation: the seal of the gift of the Holy Spirit",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Chrismation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/chrismation",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org (Cornell copy)."
          }
        ]
      ],
      [
        "Receiving converts: akriveia and oikonomia",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Canons",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/canons",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Council in Trullo (692), canons, tr. Percival (NPNF II.14)",
            "url": "https://www.newadvent.org/fathers/3814.htm",
            "note": "Public domain, New Advent. Canon 95 on receiving converts."
          }
        ]
      ],
      [
        "The Eucharist: the Mystery of the Church",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Eucharist",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/holy-eucharist",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Alexander Schmemann, The Eucharist: Sacrament of the Kingdom",
            "note": "Printed book by Schmemann (English 1988)."
          }
        ]
      ],
      [
        "The communion of saints",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Saints",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-saints",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Intercessory Prayer",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/intercessory-prayer",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Theotokos and the saints in prayer: veneration and relics",
        [
          {
            "title": "Second Council of Nicaea (787), definition, tr. Percival (NPNF II.14)",
            "url": "https://www.newadvent.org/fathers/3819.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "The Martyrdom of Polycarp, tr. Roberts and Donaldson (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0102.htm",
            "note": "Public domain, New Advent. §18 on his relics."
          }
        ]
      ],
      [
        "Death and the departure of the soul",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Death",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/sickness-suffering-and-death/death",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Funeral",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/funeral",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The intermediate state and prayer for the departed",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Funeral",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/funeral",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Judgment",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/judgment",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The toll-houses: a question among Orthodox writers",
        [
          {
            "title": "St Athanasius, Life of Antony, tr. Ellershaw (NPNF II.4)",
            "url": "https://www.newadvent.org/fathers/2811.htm",
            "note": "Public domain, New Advent. §65 is the vision of the passage through the air."
          },
          {
            "title": "Fr Seraphim Rose, The Soul After Death",
            "note": "Printed book by Seraphim Rose (1980); the case for the toll-houses."
          },
          {
            "title": "Lev (Lazar) Puhalo, The Soul, the Body and Death",
            "note": "Printed book by Puhalo (1980); the case against."
          }
        ]
      ],
      [
        "The resurrection of the body and the Last Judgement",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Resurrection",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/resurrection",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The Final Judgment",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-kingdom-of-heaven/the-final-judgment",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Heaven, hell and the hope for all",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Heaven and Hell",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-kingdom-of-heaven/heaven-and-hell",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Eternal Life",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/eternal-life",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Looking back: the Spirit, the Church and the life to come",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Symbol of Faith",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book by Kallistos Ware; chapters on the Church, the sacraments and the last things."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 5 · Scripture as the Church reads it",
    "lessons": [
      [
        "Context: the Bible as the Church's book",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Bible",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-bible/bible",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Irenaeus, Against Heresies I.8, tr. Roberts and Rambaut (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0103108.htm",
            "note": "Public domain, New Advent. The image of the king's portrait."
          }
        ]
      ],
      [
        "The canon of the Old Testament and the readable books",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Old Testament",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/old-testament",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Athanasius, Festal Letter 39 (367), NPNF II.4",
            "url": "https://www.newadvent.org/fathers/2806039.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "The Septuagint: the Old Testament of the Church",
        [
          {
            "title": "Brenton's Septuagint (1851), ebible.org",
            "url": "https://ebible.org/eng-Brenton/",
            "note": "Public domain; the complete English Septuagint."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Old Testament",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/old-testament",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The canon of the New Testament",
        [
          {
            "title": "St Athanasius, Festal Letter 39 (367), NPNF II.4",
            "url": "https://www.newadvent.org/fathers/2806039.htm",
            "note": "Public domain, New Advent. The first list of the 27 books."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The New Testament",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Inspiration: the Spirit who spoke by the prophets",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Word of God",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-bible/word-of-god",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Authorship",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-bible/authorship",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The senses of Scripture: letter, type and spirit",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Interpretation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-bible/interpretation",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Origen, On First Principles, book IV, tr. Crombie (ANF 4)",
            "url": "https://www.newadvent.org/fathers/04124.htm",
            "note": "Public domain, New Advent. Origen's three senses of Scripture."
          }
        ]
      ],
      [
        "Typology: how the Old Testament is read in Christ",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Interpretation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-bible/interpretation",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Luke 24, King James Version",
            "url": "https://ebible.org/eng-kjv/LUK24.htm",
            "note": "Public domain. Christ on the road to Emmaus."
          }
        ]
      ],
      [
        "Reading: Genesis 22 and St Augustine on the sacrifice of Isaac",
        [
          {
            "title": "Genesis 22, Brenton's Septuagint (1851)",
            "url": "https://ebible.org/eng-Brenton/GEN22.htm",
            "note": "Public domain. The text quoted."
          },
          {
            "title": "St Augustine, City of God XVI.32, tr. Marcus Dods (NPNF I.2), CCEL",
            "url": "https://ccel.org/ccel/schaff/npnf102.iv.XVI.32.html",
            "note": "Public domain; the 1887 text. The quotation is taken from here."
          },
          {
            "title": "OCA readings: Genesis 22:1-18 (Vespers, 10th reading), Holy Saturday",
            "url": "https://www.oca.org/readings/daily/2025/04/19/13",
            "note": "The OCA's lectionary page for Holy Saturday 2025."
          }
        ]
      ],
      [
        "Genesis: creation and the fall as the Church reads them",
        [
          {
            "title": "St Basil, Hexaemeron, tr. Blomfield Jackson (NPNF II.8)",
            "url": "https://www.newadvent.org/fathers/3201.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Creation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/creation",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Moses and the Exodus in the Church's reading",
        [
          {
            "title": "Exodus 3, Brenton's Septuagint (1851)",
            "url": "https://ebible.org/eng-Brenton/EXO03.htm",
            "note": "Public domain. The burning bush and the Name."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Law",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/old-testament/law",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Psalter: the prayer book of the Church",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Psalms",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/old-testament/psalms",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Brenton's Septuagint, Psalms (with Psalm 151)",
            "url": "https://ebible.org/eng-Brenton/PSA151.htm",
            "note": "Public domain."
          }
        ]
      ],
      [
        "The prophets and the Messiah",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Prophets",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/old-testament/prophets",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isaiah 7, Brenton's Septuagint (1851)",
            "url": "https://ebible.org/eng-Brenton/ISA07.htm",
            "note": "Public domain."
          }
        ]
      ],
      [
        "The Wisdom books: Proverbs, Job, Ecclesiastes, Wisdom and Sirach",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Wisdom",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/old-testament/wisdom",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Proverbs 8, Brenton's Septuagint (1851)",
            "url": "https://ebible.org/eng-Brenton/PRO08.htm",
            "note": "Public domain."
          }
        ]
      ],
      [
        "Types of the Theotokos in the Old Testament",
        [
          {
            "title": "Ezekiel 44, Brenton's Septuagint (1851)",
            "url": "https://ebible.org/eng-Brenton/EZK44.htm",
            "note": "Public domain. The closed gate."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Nativity of the Theotokos",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/nativity-of-the-theotokos",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The four Gospels and why there are four",
        [
          {
            "title": "St Irenaeus, Against Heresies III.11, tr. Roberts and Rambaut (ANF 1)",
            "url": "https://www.newadvent.org/fathers/0103311.htm",
            "note": "Public domain, New Advent. §8 on the four Gospels."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Gospels",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/gospels",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Synoptic Gospels: Matthew, Mark and Luke",
        [
          {
            "title": "Eusebius, Church History III, tr. McGiffert (NPNF II.1)",
            "url": "https://www.newadvent.org/fathers/250103.htm",
            "note": "Public domain, New Advent. Ch. 39: Papias on Mark and Matthew."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Gospels",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/gospels",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Gospel of John: the theologian's Gospel",
        [
          {
            "title": "St John Chrysostom, Homilies on the Gospel of John (NPNF I.14)",
            "url": "https://www.newadvent.org/fathers/2401.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Gospels",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/gospels",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The parables and the miracles",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Pre-Lent",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/pre-lent",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online. The parable Sundays."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Lazarus Saturday and Palm Sunday",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/lazarus-saturday-and-palm-sunday",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Sermon on the Mount and the Beatitudes",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The Beatitudes",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-beatitudes",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St John Chrysostom, Homilies on Matthew (NPNF I.10)",
            "url": "https://www.newadvent.org/fathers/2001.htm",
            "note": "Public domain, New Advent. Homilies 15–25 cover the Sermon."
          }
        ]
      ],
      [
        "The Acts of the Apostles: the Church begins",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Acts of the Apostles",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/acts-of-the-apostles1",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St John Chrysostom, Homilies on Acts (NPNF I.11)",
            "url": "https://www.newadvent.org/fathers/2101.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "St Paul: his life and letters",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Letters of Saint Paul",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/letters-of-saint-paul",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St John Chrysostom, Homilies on Romans (NPNF I.11)",
            "url": "https://www.newadvent.org/fathers/2102.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "Paul's teaching as the Church reads it: grace, faith and works",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Redemption",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-symbol-of-faith/redemption",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St John Chrysostom, Homilies on Romans (NPNF I.11)",
            "url": "https://www.newadvent.org/fathers/2102.htm",
            "note": "Public domain, New Advent."
          }
        ]
      ],
      [
        "The Catholic Epistles: James, Peter, John and Jude",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Letters of Saint James",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/letters-of-saint-james",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Letters of Saint Peter",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/letters-of-saint-peter",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Letters of Saint John",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/letters-of-saint-john",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Book of Revelation in the Orthodox Church",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Book of Revelation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/new-testament/book-of-revelation",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Archbishop Averky (Taushev), The Apocalypse of St John: An Orthodox Commentary",
            "note": "Printed book by Archbishop Averky, in English translation."
          }
        ]
      ],
      [
        "The Fathers as interpreters of Scripture",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Fathers",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-fathers",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "New Advent: the Fathers of the Church (index)",
            "url": "https://www.newadvent.org/fathers/",
            "note": "Free: the ANF and NPNF series, including Chrysostom's homilies."
          }
        ]
      ],
      [
        "Scripture in the services: the lectionary",
        [
          {
            "title": "OCA: daily Scripture readings",
            "url": "https://www.oca.org/readings",
            "note": "The OCA's daily lectionary."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Church Year",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/church-year",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Reading the Bible as an Orthodox Christian today",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Interpretation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/the-bible/interpretation",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Theodore Stylianopoulos, The New Testament: An Orthodox Perspective",
            "note": "Printed book by Stylianopoulos (1997), on Scripture, Tradition and hermeneutics."
          }
        ]
      ],
      [
        "Looking back: Scripture as the Church reads it",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: Doctrine and Scripture",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "John Breck, Scripture in Tradition",
            "note": "Printed book by Fr John Breck (2001) on the Bible in the Orthodox Church."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 6 · Worship",
    "lessons": [
      [
        "Context: worship as theology",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Divine Liturgy",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/the-divine-liturgy",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org. The service texts quoted are taken from here."
          }
        ]
      ],
      [
        "The temple: narthex, nave, iconostasis and altar",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Church Building",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-building/church-building",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Altar Table",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-building/altar-table",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Icons: the theology of the image",
        [
          {
            "title": "St John of Damascus, On Holy Images, tr. Mary H. Allies (1898)",
            "url": "https://sourcebooks.fordham.edu/basis/johndamascus-images.asp",
            "note": "Public domain, Internet Medieval Sourcebook (Fordham). The quotation is taken from here."
          },
          {
            "title": "Second Council of Nicaea (787), tr. Percival (NPNF II.14)",
            "url": "https://www.newadvent.org/fathers/3819.htm",
            "note": "Public domain, New Advent."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Icons",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-building/icons",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Clergy, servers and vestments",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Vestments",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-building/vestments",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Orders",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/holy-orders",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The three Liturgies: Chrysostom, Basil and the Presanctified",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Divine Liturgy",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/the-divine-liturgy",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Liturgy of the Presanctified Gifts",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/liturgy-of-the-presanctified-gifts",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 1: the Proskomedia",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Prothesis",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/prothesis",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Oblation Table",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-building/oblation-table",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org. The service texts quoted are taken from here."
          }
        ]
      ],
      [
        "The Divine Liturgy 2: \"Blessed is the kingdom\" and the Great Litany",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Blessed Is the Kingdom",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/blessed-is-the-kingdom",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Great Litany",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/great-litany",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 3: the antiphons and the Little Entrance",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Antiphons",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/antiphons",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Small Entrance",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/small-entrance",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 4: the Trisagion, the Epistle and the Gospel",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Epistle",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/epistle",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Gospel",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/gospel",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 5: the catechumens and the Cherubic Hymn",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Fervent Supplication",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/fervent-supplication",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Offertory and Great Entrance",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/offertory-great-entrance",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 6: the kiss of peace and the Creed",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Love and Faith",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/love-and-faith",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org. The service texts quoted are taken from here."
          }
        ]
      ],
      [
        "Reading: the anaphora of St John Chrysostom (Hapgood, 1906)",
        [
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org. The service texts quoted are taken from here."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Eucharistic Canon (Anaphora)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/eucharistic-canon-anaphora",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 7: the epiclesis and the commemorations",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Epiklesis",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/epiklesis",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Remembrances",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/rememberances",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 8: the Lord's Prayer, \"Holy things unto the Holy\" and Communion",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Our Father",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/our-father",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Communion",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/communion",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The Divine Liturgy 9: thanksgiving and dismissal",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Thanksgiving",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/thanksgiving",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Benediction and Dismissal",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-divine-liturgy/benediction-and-dismissal",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Preparing for Communion: fasting, confession and prayer",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Eucharist",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/holy-eucharist",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Nikodemos the Hagiorite and St Makarios of Corinth, On Frequent Communion",
            "note": "Printed book by St Nikodemos and St Makarios (1783); in English translation."
          }
        ]
      ],
      [
        "The daily cycle of services: from Vespers to the Hours",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Hours, Compline and Nocturne",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-daily-cycles-of-prayer/hours-compline-and-nocturne",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Prayer (the daily cycles)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-daily-cycles-of-prayer/prayer",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Vespers and Matins: the evening and morning services",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Vespers",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-daily-cycles-of-prayer/vespers",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Matins",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-daily-cycles-of-prayer/matins",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "St Basil, On the Holy Spirit 29, tr. Jackson (NPNF II.8)",
            "url": "https://www.newadvent.org/fathers/3203.htm",
            "note": "Public domain, New Advent. §73 on the lamp-lighting hymn."
          }
        ]
      ],
      [
        "The Typikon and the service books",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 1: The Liturgy (as a source of doctrine)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/doctrine-scripture/sources-of-christian-doctrine/the-liturgy",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org. The service texts quoted are taken from here."
          }
        ]
      ],
      [
        "The weekly cycle: the days of the week and the eight tones",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Church Year",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/church-year",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "The Didache, tr. M. B. Riddle (ANF 7)",
            "url": "https://www.newadvent.org/fathers/0714.htm",
            "note": "Public domain, New Advent. Ch. 8 on the Wednesday and Friday fast."
          }
        ]
      ],
      [
        "The yearly cycle: the fixed and movable calendars",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The Church Year",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/church-year",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Easter Sunday, the Holy Pascha",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/easter-sunday-the-holy-pascha",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The twelve great feasts: the feasts of the Lord",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Epiphany",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/epiphany",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Elevation of the Cross",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/elevation-of-the-cross",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Transfiguration",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/transfiguration",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The twelve great feasts: the feasts of the Theotokos, and Pascha",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Dormition of the Theotokos",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/dormition-of-the-theotokos",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Annunciation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/annunciation",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Entrance of the Theotokos to the Temple",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/entrance-of-the-theotokos-to-the-temple",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Great Lent: from the Triodion to Holy Week",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Great Lent",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/great-lent",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Sundays of Lent",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/sundays-of-lent",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Alexander Schmemann, Great Lent",
            "note": "Printed book by Schmemann (1969)."
          }
        ]
      ],
      [
        "Holy Week and Pascha",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Week",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/holy-week",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Saturday",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/holy-saturday",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Easter Sunday, the Holy Pascha",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/easter-sunday-the-holy-pascha",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "The fasts and the rule of fasting",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Lenten Fasting",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year/lenten-fasting",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Fasting",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/fasting",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Confession: the Mystery of repentance",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Penance",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/penance",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org. The service texts quoted are taken from here."
          }
        ]
      ],
      [
        "Marriage: the crowning",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Marriage",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/marriage",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Marriage",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/sexuality-marriage-and-family/marriage1",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          }
        ]
      ],
      [
        "Holy unction and ordination",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Unction",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/holy-unction",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Holy Orders",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/holy-orders",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906)",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain; scan of the 1906 edition on archive.org. The service texts quoted are taken from here."
          }
        ]
      ],
      [
        "Looking back: worship",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Worship",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship",
            "note": "Fr Thomas Hopko, The Orthodox Faith (OCA). Free online."
          },
          {
            "title": "Alexander Schmemann, The Eucharist: Sacrament of the Kingdom",
            "note": "Printed book by Schmemann (English 1988)."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 7 · The early Church and the first four councils",
    "lessons": [
      [
        "Context: from Pentecost to Chalcedon",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Church (first century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/first-century/the-church1",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Seven Ecumenical Councils (NPNF 2nd series vol. 14), CCEL",
            "url": "https://ccel.org/ccel/schaff/npnf214",
            "note": "The acts, creeds and canons in Percival's 1900 edition. Public domain."
          }
        ]
      ],
      [
        "The apostolic age: from Jerusalem to the nations",
        [
          {
            "title": "Hopko, The Orthodox Faith: Christ and the Apostles",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/first-century/christ-and-the-apostles",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith: The Church (first century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/first-century/the-church1",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "The Council of Jerusalem: the first council",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Church (first century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/first-century/the-church1",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Acts 15, King James Version (Project Gutenberg)",
            "url": "https://www.gutenberg.org/ebooks/10",
            "note": "The KJV Bible, public domain."
          }
        ]
      ],
      [
        "The Apostolic Fathers: Clement, Ignatius, Polycarp and the Didache",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Apostolic Fathers",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/second-century/the-apostolic-fathers",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "St Clement of Rome, Letter to the Corinthians",
            "url": "https://www.newadvent.org/fathers/1010.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent."
          },
          {
            "title": "The Didache",
            "url": "https://www.newadvent.org/fathers/0714.htm",
            "note": "Public domain translation, on New Advent."
          }
        ]
      ],
      [
        "Reading: St Ignatius of Antioch to the Smyrnaeans",
        [
          {
            "title": "St Ignatius, Epistle to the Smyrnaeans, tr. Roberts and Donaldson",
            "url": "https://www.newadvent.org/fathers/0109.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent. The lesson quotes the CCEL text of the 1885 printing; New Advent modernises 'ye' to 'you'."
          },
          {
            "title": "ANF 1: The Apostolic Fathers with Justin Martyr and Irenaeus, CCEL",
            "url": "https://ccel.org/ccel/schaff/anf01",
            "note": "The 1885 edition, with both recensions of Ignatius. Public domain."
          }
        ]
      ],
      [
        "The martyrs: from St Stephen to St Polycarp",
        [
          {
            "title": "The Martyrdom of Polycarp",
            "url": "https://www.newadvent.org/fathers/0102.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent."
          },
          {
            "title": "Hopko, The Orthodox Faith: The Persecutions",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/second-century/the-persecutions",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "The great persecutions: Decius, Valerian and Diocletian",
        [
          {
            "title": "Hopko, The Orthodox Faith: Persecution (third century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/third-century/persecution",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Eusebius, Church History",
            "url": "https://www.newadvent.org/fathers/2501.htm",
            "note": "NPNF 2nd series vol. 1 (1890), public domain. Book 8 is the Great Persecution."
          }
        ]
      ],
      [
        "St Justin Martyr and the apologists",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Apologists",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/second-century/the-apologists",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "St Justin Martyr, The First Apology",
            "url": "https://www.newadvent.org/fathers/0126.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent. Chapters 65 to 67 describe the Sunday Liturgy."
          },
          {
            "title": "The Epistle to Diognetus",
            "url": "https://www.newadvent.org/fathers/0101.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent."
          }
        ]
      ],
      [
        "Gnosticism and St Irenaeus of Lyons",
        [
          {
            "title": "Hopko, The Orthodox Faith: Protecting the Church from Falsehood and Heresy",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/second-century/protecting-the-church-from-falsehood-and-heresy",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "St Irenaeus, Against Heresies",
            "url": "https://www.newadvent.org/fathers/0103.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent."
          }
        ]
      ],
      [
        "The rule of faith, the canon and the bishops: how the second century kept the faith",
        [
          {
            "title": "Hopko, The Orthodox Faith: Church Order and Liturgy",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/second-century/church-order-and-liturgy",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "St Athanasius, Festal Letter 39 (367)",
            "url": "https://www.newadvent.org/fathers/2806039.htm",
            "note": "NPNF 2nd series vol. 4 (1892), public domain. The first list of the 27 books."
          }
        ]
      ],
      [
        "Alexandria's school: St Clement and Origen",
        [
          {
            "title": "Hopko, The Orthodox Faith: Development of Theology (third century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/third-century/development-of-theology",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Origen, De Principiis (On First Principles)",
            "url": "https://www.newadvent.org/fathers/0412.htm",
            "note": "Ante-Nicene Fathers vol. 4 (1885), public domain."
          }
        ]
      ],
      [
        "St Cyprian of Carthage, the lapsed and the unity of the Church",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Lapsed",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/third-century/the-lapsed",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "St Cyprian, On the Unity of the Church (Treatise 1)",
            "url": "https://www.newadvent.org/fathers/050701.htm",
            "note": "Ante-Nicene Fathers vol. 5 (1886), public domain."
          }
        ]
      ],
      [
        "St Constantine and the end of persecution",
        [
          {
            "title": "Hopko, The Orthodox Faith: Constantine",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourth-century/constantine",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Eusebius, Life of Constantine",
            "url": "https://www.newadvent.org/fathers/2502.htm",
            "note": "NPNF 2nd series vol. 1 (1890), public domain. Book 1, chapters 28 to 31, the vision."
          }
        ]
      ],
      [
        "Arius and the crisis at Alexandria",
        [
          {
            "title": "Hopko, The Orthodox Faith: Arianism",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourth-century/arianism",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Socrates Scholasticus, Church History",
            "url": "https://www.newadvent.org/fathers/2601.htm",
            "note": "NPNF 2nd series vol. 2 (1890), public domain. Book 1 tells the outbreak of the controversy."
          }
        ]
      ],
      [
        "The First Ecumenical Council: Nicaea (325)",
        [
          {
            "title": "Hopko, The Orthodox Faith: The First Ecumenical Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourth-century/the-first-ecumenical-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The First Council of Nicaea: creed and canons",
            "url": "https://www.newadvent.org/fathers/3801.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "St Athanasius and the fifty years after Nicaea",
        [
          {
            "title": "Hopko, The Orthodox Faith: Saint Athanasius and his Defence of Nicea",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourth-century/saint-athanasius-and-his-defence-of-nicea",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "St Athanasius, Apologia contra Arianos (Defence against the Arians)",
            "url": "https://www.newadvent.org/fathers/2808.htm",
            "note": "NPNF 2nd series vol. 4 (1892), public domain."
          }
        ]
      ],
      [
        "The Cappadocians and the divinity of the Holy Spirit",
        [
          {
            "title": "Hopko, The Orthodox Faith: New Heresies (fourth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourth-century/new-heresies",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "St Basil, On the Holy Spirit",
            "url": "https://www.newadvent.org/fathers/3203.htm",
            "note": "NPNF 2nd series vol. 8 (1895), public domain."
          },
          {
            "title": "St Gregory the Theologian, Fifth Theological Oration (Oration 31)",
            "url": "https://www.newadvent.org/fathers/310231.htm",
            "note": "NPNF 2nd series vol. 7 (1893), public domain."
          }
        ]
      ],
      [
        "The Second Ecumenical Council: Constantinople (381) and the Creed",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Second Ecumenical Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourth-century/the-second-ecumenical-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The First Council of Constantinople: creed and canons",
            "url": "https://www.newadvent.org/fathers/3808.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "The canons of the first councils: Pascha, the great sees and New Rome",
        [
          {
            "title": "Hopko, The Orthodox Faith: Canons of the Councils",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/canons-of-the-councils",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith: Five Patriarchates",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixth-century/five-patriarchates",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The First Council of Nicaea: the canons",
            "url": "https://www.newadvent.org/fathers/3801.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "Nestorius and St Cyril: the Theotokos question",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Third Ecumenical Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/third-ecumenical-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Council of Ephesus, with Cyril's letters and anathemas",
            "url": "https://www.newadvent.org/fathers/3810.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "The Third Ecumenical Council: Ephesus (431) and the reunion of 433",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Third Ecumenical Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/third-ecumenical-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Council of Ephesus (431)",
            "url": "https://www.newadvent.org/fathers/3810.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "Eutyches, the Robber Council (449) and the Tome of Leo",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Robber Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/the-robber-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Pope St Leo the Great, Letter 28: the Tome",
            "url": "https://www.newadvent.org/fathers/3604028.htm",
            "note": "NPNF 2nd series vol. 12 (1895), public domain."
          }
        ]
      ],
      [
        "The Fourth Ecumenical Council: Chalcedon (451)",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Fourth Ecumenical Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/the-fourth-ecumenical-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Council of Chalcedon: definition and canons",
            "url": "https://www.newadvent.org/fathers/3811.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "Why some churches did not receive Chalcedon",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Monophysites",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/the-monophysites",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith: The Henotikon",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/the-henotikon",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "The Oriental Orthodox churches",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Oriental Orthodox Churches",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixth-century/the-oriental-orthodox-churches",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith: Emperor Justinian I and the Non-Chalcedonians",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixth-century/emperor-justinian-i-and-the-non-chalcedonians",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "Looking back: the faith of the four councils",
        [
          {
            "title": "Hopko, The Orthodox Faith: Inner Struggles (fifth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifth-century/inner-struggles",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Seven Ecumenical Councils (NPNF 2nd series vol. 14), CCEL",
            "url": "https://ccel.org/ccel/schaff/npnf214",
            "note": "Percival's 1900 edition. Public domain."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 8 · The later councils and the Byzantine Church",
    "lessons": [
      [
        "Context: from Chalcedon to the fall of Constantinople",
        [
          {
            "title": "Hopko, The Orthodox Faith: Five Patriarchates",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixth-century/five-patriarchates",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "John Meyendorff, Byzantine Theology: Historical Trends and Doctrinal Themes",
            "note": "Printed book (Fordham, 1974; 2nd ed. 1979): the standard Orthodox survey of the period."
          }
        ]
      ],
      [
        "Justinian, Hagia Sophia and the ideal of symphonia",
        [
          {
            "title": "Hopko, The Orthodox Faith: Emperor Justinian I and Reform",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixth-century/emperor-justinian-i-and-reform",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Hagia Sophia (Constantinople)",
            "url": "https://orthodoxwiki.org/Hagia_Sophia_(Constantinople)",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The Fifth Ecumenical Council: Constantinople II (553)",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Fifth Ecumenical Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixth-century/the-fifth-ecumenical-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Second Council of Constantinople (553): the capitula",
            "url": "https://www.newadvent.org/fathers/3812.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "Monoenergism and Monothelitism: one will in Christ?",
        [
          {
            "title": "Hopko, The Orthodox Faith: Monoenergism, Monothelitism",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventh-century/monoenergism-monothelitism",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Monothelitism",
            "url": "https://orthodoxwiki.org/Monothelitism",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Maximus the Confessor and the two wills",
        [
          {
            "title": "Hopko, The Orthodox Faith: Saint Maximus the Confessor and Saint Martin of Rome",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventh-century/saint-maximus-the-confessor-and-saint-martin-of-rome",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Maximus the Confessor",
            "url": "https://orthodoxwiki.org/Maximus_the_Confessor",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The Lateran Synod (649) and the sufferings of St Martin and St Maximus",
        [
          {
            "title": "Hopko, The Orthodox Faith: Saint Maximus the Confessor and Saint Martin of Rome",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventh-century/saint-maximus-the-confessor-and-saint-martin-of-rome",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith: Relations with Rome (seventh century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventh-century/relations-with-rome",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "The Sixth Ecumenical Council: Constantinople III (680 to 681)",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Sixth Ecumenical Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventh-century/the-sixth-ecumenical-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Third Council of Constantinople (680 to 681): the definition",
            "url": "https://www.newadvent.org/fathers/3813.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "The Council in Trullo (692) and the canons of the Orthodox Church",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Council of Trullo, or the Quinisext Council",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventh-century/the-council-of-trullo-or-the-quinisext-council",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "The Council in Trullo (692): the canons",
            "url": "https://www.newadvent.org/fathers/3814.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          }
        ]
      ],
      [
        "The rise of Islam and the Orthodox patriarchates under the caliphs",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Rise of Islam",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventh-century/the-rise-of-islam",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Islam",
            "url": "https://orthodoxwiki.org/Islam",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The first Iconoclasm: Leo III, Constantine V and the council of Hieria (754)",
        [
          {
            "title": "Hopko, The Orthodox Faith: Iconoclasm",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/eighth-century/iconoclasm",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Iconoclasm",
            "url": "https://orthodoxwiki.org/Iconoclasm",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St John of Damascus and the defence of the holy icons",
        [
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book IV (ch. 16, on images)",
            "url": "https://www.newadvent.org/fathers/33044.htm",
            "note": "NPNF 2nd series vol. 9, tr. S. D. F. Salmond (1898), public domain."
          },
          {
            "title": "Hopko, The Orthodox Faith: Iconoclasm",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/eighth-century/iconoclasm",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "The Seventh Ecumenical Council: Nicaea II (787)",
        [
          {
            "title": "The Second Council of Nicaea (787): acts, definition and canons",
            "url": "https://www.newadvent.org/fathers/3819.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent."
          },
          {
            "title": "OrthodoxWiki: Seventh Ecumenical Council",
            "url": "https://orthodoxwiki.org/Seventh_Ecumenical_Council",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "Reading: the definition of the Seventh Ecumenical Council",
        [
          {
            "title": "The Second Council of Nicaea (787), tr. ed. Percival",
            "url": "https://www.newadvent.org/fathers/3819.htm",
            "note": "Nicene and Post-Nicene Fathers 2nd series vol. 14, ed. Percival (1900), public domain, on New Advent. The lesson quotes the CCEL text of the same edition."
          },
          {
            "title": "The Seven Ecumenical Councils (NPNF 2nd series vol. 14), CCEL",
            "url": "https://ccel.org/ccel/schaff/npnf214",
            "note": "Percival's 1900 edition. Public domain."
          }
        ]
      ],
      [
        "The second Iconoclasm and St Theodore the Studite",
        [
          {
            "title": "OrthodoxWiki: Theodore the Studite",
            "url": "https://orthodoxwiki.org/Theodore_the_Studite",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "Hopko, The Orthodox Faith: The End of Iconoclasm",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/ninth-century/the-end-of-iconoclasm",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "The Triumph of Orthodoxy (843) and the Synodikon",
        [
          {
            "title": "Hopko, The Orthodox Faith: The End of Iconoclasm",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/ninth-century/the-end-of-iconoclasm",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Sunday of Orthodoxy",
            "url": "https://orthodoxwiki.org/Sunday_of_Orthodoxy",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Photios the Great",
        [
          {
            "title": "Hopko, The Orthodox Faith: Saint Photius, Patriarch of Constantinople",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/ninth-century/saint-photius-patriarch-of-constantinople",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Photius the Great",
            "url": "https://orthodoxwiki.org/Photius_the_Great",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "Sts Cyril and Methodius and the mission to the Slavs",
        [
          {
            "title": "Hopko, The Orthodox Faith: Saints Cyril and Methodius, Evangelizers of the Slavs",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/ninth-century/saints-cyril-and-methodiusevangelizers-of-the-slavs-and-equal-to-the-apostl",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Cyril and Methodius",
            "url": "https://orthodoxwiki.org/Cyril_and_Methodius",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The filioque: a question of the Creed, as history",
        [
          {
            "title": "OrthodoxWiki: Filioque",
            "url": "https://orthodoxwiki.org/Filioque",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "Hopko, The Orthodox Faith: The Papacy (ninth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/ninth-century/the-papacy",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "1054: the schism as an event and as a process",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Great Schism",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/eleventh-century/the-great-schism",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Great Schism",
            "url": "https://orthodoxwiki.org/Great_Schism",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The Crusades and the sack of Constantinople (1204)",
        [
          {
            "title": "Hopko, The Orthodox Faith: The First Crusade",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/eleventh-century/the-first-crusade",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith: The Fourth Crusade",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/thirteenth-century/the-fourth-crusade",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Fourth Crusade",
            "url": "https://orthodoxwiki.org/Fourth_Crusade",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Gregory Palamas and the hesychast councils (1341 to 1351)",
        [
          {
            "title": "Hopko, The Orthodox Faith: Saint Gregory Palamas",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourteenth-century/saint-gregory-palamas",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Gregory Palamas",
            "url": "https://orthodoxwiki.org/Gregory_Palamas",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "OrthodoxWiki: Hesychasm",
            "url": "https://orthodoxwiki.org/Hesychasm",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The councils of union: Lyons (1274), Florence (1438 to 1439) and St Mark of Ephesus",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Second Council of Lyons",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/thirteenth-century/the-second-council-of-lyons",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Council of Florence",
            "url": "https://orthodoxwiki.org/Council_of_Florence",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "OrthodoxWiki: Mark of Ephesus",
            "url": "https://orthodoxwiki.org/Mark_of_Ephesus",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The fall of Constantinople (1453)",
        [
          {
            "title": "Hopko, The Orthodox Faith: The Fall of Byzantium",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifteenth-century/the-fall-of-byzantium",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          },
          {
            "title": "Hopko, The Orthodox Faith: The Establishment of the Rum Milet",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifteenth-century/the-establishment-of-the-rum-milet",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3: Church History (OCA). Free online."
          }
        ]
      ],
      [
        "Looking back: the councils of Christ and the Church of Byzantium",
        [
          {
            "title": "The Seven Ecumenical Councils (NPNF 2nd series vol. 14), CCEL",
            "url": "https://ccel.org/ccel/schaff/npnf214",
            "note": "Percival's 1900 edition. Public domain."
          },
          {
            "title": "Leo Donald Davis, The First Seven Ecumenical Councils (325 to 787)",
            "note": "Printed book (Liturgical Press, 1983): a clear history of all seven."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 9 · Reading the Fathers",
    "lessons": [
      [
        "Context: how to read a Father of the Church",
        [
          {
            "title": "OrthodoxWiki: Church Fathers",
            "url": "https://orthodoxwiki.org/Church_Fathers",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "Nicene and Post-Nicene Fathers and Ante-Nicene Fathers, CCEL",
            "url": "https://ccel.org/fathers",
            "note": "The whole public-domain series, free online."
          }
        ]
      ],
      [
        "St Ignatius of Antioch: the letters of a man on his way to die",
        [
          {
            "title": "St Ignatius, Epistle to the Romans",
            "url": "https://www.newadvent.org/fathers/0107.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent."
          },
          {
            "title": "St Ignatius, Epistle to the Ephesians",
            "url": "https://www.newadvent.org/fathers/0104.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent."
          },
          {
            "title": "OrthodoxWiki: Ignatius of Antioch",
            "url": "https://orthodoxwiki.org/Ignatius_of_Antioch",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Irenaeus of Lyons: \"become what we are\"",
        [
          {
            "title": "St Irenaeus, Against Heresies, Book V",
            "url": "https://www.newadvent.org/fathers/0103500.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent. The preface holds the sentence read in the lesson."
          },
          {
            "title": "OrthodoxWiki: Irenaeus of Lyons",
            "url": "https://orthodoxwiki.org/Irenaeus_of_Lyons",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Irenaeus: \"the glory of God is a living man\"",
        [
          {
            "title": "St Irenaeus, Against Heresies IV.20",
            "url": "https://www.newadvent.org/fathers/0103420.htm",
            "note": "Ante-Nicene Fathers vol. 1 (1885), public domain, on New Advent. Section 7 is the passage read."
          }
        ]
      ],
      [
        "St Athanasius: On the Incarnation",
        [
          {
            "title": "St Athanasius, On the Incarnation of the Word, tr. Archibald Robertson",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "NPNF 2nd series vol. 4 (1892), public domain."
          },
          {
            "title": "OrthodoxWiki: Athanasius the Great",
            "url": "https://orthodoxwiki.org/Athanasius_the_Great",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Athanasius: the Life of Antony and the defence of Nicaea",
        [
          {
            "title": "St Athanasius, Life of St Antony",
            "url": "https://www.newadvent.org/fathers/2811.htm",
            "note": "NPNF 2nd series vol. 4 (1892), public domain."
          },
          {
            "title": "St Athanasius, Four Discourses against the Arians",
            "url": "https://www.newadvent.org/fathers/2816.htm",
            "note": "NPNF 2nd series vol. 4 (1892), public domain."
          }
        ]
      ],
      [
        "St Basil the Great: On the Holy Spirit",
        [
          {
            "title": "St Basil, On the Holy Spirit, tr. Blomfield Jackson",
            "url": "https://www.newadvent.org/fathers/3203.htm",
            "note": "NPNF 2nd series vol. 8 (1895), public domain. Chapter 18 holds the passage read."
          },
          {
            "title": "OrthodoxWiki: Basil the Great",
            "url": "https://orthodoxwiki.org/Basil_the_Great",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Basil the Great: the Hexaemeron, the Rules and the new city",
        [
          {
            "title": "St Basil, Hexaemeron",
            "url": "https://www.newadvent.org/fathers/3201.htm",
            "note": "NPNF 2nd series vol. 8 (1895), public domain."
          },
          {
            "title": "OrthodoxWiki: Basil the Great",
            "url": "https://orthodoxwiki.org/Basil_the_Great",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Gregory the Theologian: the Theological Orations",
        [
          {
            "title": "St Gregory the Theologian, First Theological Oration (Oration 27)",
            "url": "https://www.newadvent.org/fathers/310227.htm",
            "note": "NPNF 2nd series vol. 7 (1893), tr. Browne and Swallow, public domain."
          },
          {
            "title": "OrthodoxWiki: Gregory the Theologian",
            "url": "https://orthodoxwiki.org/Gregory_the_Theologian",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Gregory the Theologian: \"that which He has not assumed He has not healed\"",
        [
          {
            "title": "St Gregory the Theologian, Letters, Division I (includes Letter 101, to Cledonius)",
            "url": "https://www.newadvent.org/fathers/3103a.htm",
            "note": "NPNF 2nd series vol. 7 (1893), public domain."
          }
        ]
      ],
      [
        "St Gregory of Nyssa: the endless ascent",
        [
          {
            "title": "OrthodoxWiki: Gregory of Nyssa",
            "url": "https://orthodoxwiki.org/Gregory_of_Nyssa",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "Gregory of Nyssa: Dogmatic Treatises (NPNF 2nd series vol. 5), CCEL",
            "url": "https://ccel.org/ccel/schaff/npnf205",
            "note": "Public domain: Against Eunomius, On the Making of Man, the Great Catechism, On the Soul and the Resurrection. The Life of Moses is not in it."
          }
        ]
      ],
      [
        "St Ephrem the Syrian: theology as song",
        [
          {
            "title": "St Ephrem, Hymns on the Nativity, tr. J. B. Morris, rev. J. Gwynn",
            "url": "https://www.newadvent.org/fathers/3703.htm",
            "note": "NPNF 2nd series vol. 13, public domain. Hymn 5 holds the passage read."
          },
          {
            "title": "OrthodoxWiki: Ephraim the Syrian",
            "url": "https://orthodoxwiki.org/Ephraim_the_Syrian",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St John Chrysostom: the preacher of Antioch and Constantinople",
        [
          {
            "title": "St John Chrysostom, Homily 50 on Matthew",
            "url": "https://www.newadvent.org/fathers/200150.htm",
            "note": "NPNF 1st series vol. 10 (1888), tr. Prevost, rev. Riddle, public domain."
          },
          {
            "title": "OrthodoxWiki: John Chrysostom",
            "url": "https://orthodoxwiki.org/John_Chrysostom",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St John Chrysostom: On the Priesthood and the Liturgy that bears his name",
        [
          {
            "title": "St John Chrysostom, On the Priesthood",
            "url": "https://www.newadvent.org/fathers/1922.htm",
            "note": "NPNF 1st series vol. 9, public domain."
          },
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906), archive.org",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain. Scan of the Cornell copy; the Paschal services and the Catechetical Discourse are on pp. 235 to 236."
          }
        ]
      ],
      [
        "Reading: St John Chrysostom's Paschal Homily",
        [
          {
            "title": "Isabel F. Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (1906), archive.org",
            "url": "https://archive.org/details/cu31924029363128",
            "note": "Public domain. Scan of the Cornell copy; the Paschal services and the Catechetical Discourse are on pp. 235 to 236."
          },
          {
            "title": "OrthodoxWiki: Paschal Homily",
            "url": "https://orthodoxwiki.org/Paschal_Homily",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Cyril of Alexandria: the one Christ",
        [
          {
            "title": "The Council of Ephesus, with Cyril's Third Letter to Nestorius and the twelve anathemas",
            "url": "https://www.newadvent.org/fathers/3810.htm",
            "note": "NPNF 2nd series vol. 14, ed. Percival (1900), public domain."
          },
          {
            "title": "OrthodoxWiki: Cyril of Alexandria",
            "url": "https://orthodoxwiki.org/Cyril_of_Alexandria",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "The Dionysian writings: the divine names and the hierarchies",
        [
          {
            "title": "Stanford Encyclopedia of Philosophy: Pseudo-Dionysius the Areopagite",
            "url": "https://plato.stanford.edu/entries/pseudo-dionysius-areopagite/",
            "note": "Free; the authorship question and the philosophy."
          },
          {
            "title": "OrthodoxWiki: Dionysius the Areopagite",
            "url": "https://orthodoxwiki.org/Dionysius_the_Areopagite",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Maximus the Confessor: the Logos and the logoi",
        [
          {
            "title": "OrthodoxWiki: Maximus the Confessor",
            "url": "https://orthodoxwiki.org/Maximus_the_Confessor",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "Andrew Louth, Maximus the Confessor (Early Church Fathers series)",
            "note": "Printed book (Routledge, 1996): introduction with translations of the Ambigua."
          }
        ]
      ],
      [
        "St Maximus the Confessor: love and the passions",
        [
          {
            "title": "OrthodoxWiki: Maximus the Confessor",
            "url": "https://orthodoxwiki.org/Maximus_the_Confessor",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "The Philokalia, vol. 2, tr. Palmer, Sherrard and Ware",
            "note": "Printed book (Faber, 1981): holds the Four Hundred Chapters on Love. In copyright, so the lesson paraphrases."
          }
        ]
      ],
      [
        "St John of Damascus: the Exact Exposition of the Orthodox Faith",
        [
          {
            "title": "St John of Damascus, An Exposition of the Orthodox Faith, tr. S. D. F. Salmond",
            "url": "https://www.newadvent.org/fathers/3304.htm",
            "note": "NPNF 2nd series vol. 9 (1898), public domain."
          },
          {
            "title": "OrthodoxWiki: John of Damascus",
            "url": "https://orthodoxwiki.org/John_of_Damascus",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St John of Damascus: on the holy images",
        [
          {
            "title": "St John of Damascus, Exposition of the Orthodox Faith, Book IV",
            "url": "https://www.newadvent.org/fathers/33044.htm",
            "note": "NPNF 2nd series vol. 9 (1898), public domain. Chapter 16, Concerning Images."
          }
        ]
      ],
      [
        "St Symeon the New Theologian: the experience of grace",
        [
          {
            "title": "OrthodoxWiki: Symeon the New Theologian",
            "url": "https://orthodoxwiki.org/Symeon_the_New_Theologian",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "Hilarion Alfeyev, St Symeon the New Theologian and Orthodox Tradition",
            "note": "Printed book (Oxford, 2000), by Metropolitan Hilarion."
          }
        ]
      ],
      [
        "St Gregory Palamas: essence and energies",
        [
          {
            "title": "Hopko, The Orthodox Faith: Saint Gregory Palamas",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourteenth-century/saint-gregory-palamas",
            "note": "Fr Thomas Hopko, The Orthodox Faith, vol. 3 (OCA). Free online."
          },
          {
            "title": "OrthodoxWiki: Gregory Palamas",
            "url": "https://orthodoxwiki.org/Gregory_Palamas",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          }
        ]
      ],
      [
        "St Gregory Palamas: the light of Tabor and the body in prayer",
        [
          {
            "title": "OrthodoxWiki: Hesychasm",
            "url": "https://orthodoxwiki.org/Hesychasm",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "John Meyendorff, St Gregory Palamas and Orthodox Spirituality",
            "note": "Printed book (St Vladimir's Seminary Press, 1974)."
          }
        ]
      ],
      [
        "Where the Fathers differ: theologoumena, Origen, Gregory of Nyssa and Augustine",
        [
          {
            "title": "St Vincent of Lérins, Commonitory, tr. C. A. Heurtley",
            "url": "https://www.newadvent.org/fathers/3506.htm",
            "note": "NPNF 2nd series vol. 11 (1894), public domain. Chapter 2 holds the rule."
          },
          {
            "title": "OrthodoxWiki: Augustine of Hippo",
            "url": "https://orthodoxwiki.org/Augustine_of_Hippo",
            "note": "Free Orthodox encyclopedia, written by Orthodox contributors."
          },
          {
            "title": "Fr Seraphim Rose, The Place of Blessed Augustine in the Orthodox Church",
            "note": "Printed book (St Herman of Alaska Brotherhood, 1983)."
          }
        ]
      ],
      [
        "Looking back: the Fathers in their own words",
        [
          {
            "title": "Nicene and Post-Nicene Fathers and Ante-Nicene Fathers, CCEL",
            "url": "https://ccel.org/fathers",
            "note": "The whole public-domain series, free online."
          },
          {
            "title": "St Athanasius, On the Incarnation",
            "url": "https://www.newadvent.org/fathers/2802.htm",
            "note": "The best first book of the Fathers to read whole. NPNF 2nd series vol. 4 (1892)."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 10 · The spiritual life",
    "lessons": [
      [
        "Context: the spiritual life as the Creed lived",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Spirituality",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/spirituality",
            "note": "The OCA's catechism on what 'spiritual' means. Free."
          },
          {
            "title": "Kallistos Ware, The Orthodox Way",
            "note": "Printed book by Metropolitan Kallistos Ware; its chapters on prayer and the spiritual way suit this whole stage."
          }
        ]
      ],
      [
        "The aim of the Christian life: acquiring the Holy Spirit",
        [
          {
            "title": "OrthodoxWiki: Seraphim of Sarov",
            "url": "https://orthodoxwiki.org/Seraphim_of_Sarov",
            "note": "Life, dates and the Motovilov conversation in outline."
          },
          {
            "title": "St Seraphim's conversation with Motovilov (Orthodox Christian Information Center)",
            "url": "http://www.orthodoxinfo.com/praxis/wonderful.aspx",
            "note": "An English translation of the whole conversation; the translator is not named, so the lesson paraphrases it."
          }
        ]
      ],
      [
        "What prayer is, and its three kinds",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Prayer",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/prayer1",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Liturgical prayer",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/liturgical-prayer",
            "note": "Free."
          }
        ]
      ],
      [
        "The rule of prayer and the icon corner",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Unceasing prayer",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/unceasing-prayer",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Intercessory prayer",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/intercessory-prayer",
            "note": "Free."
          }
        ]
      ],
      [
        "The Jesus Prayer: its words and its roots",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The Jesus Prayer",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/the-jesus-prayer",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Jesus Prayer",
            "url": "https://orthodoxwiki.org/Jesus_Prayer",
            "note": "Forms, history and patristic sources."
          },
          {
            "title": "John Cassian, Conference 10 (On Prayer), tr. C. S. Gibson, NPNF 2nd ser. vol. 11 (1894)",
            "url": "https://www.newadvent.org/fathers/350810.htm",
            "note": "Public domain. Chapter 10 gives the desert monks' one-verse prayer."
          }
        ]
      ],
      [
        "Reading: The Way of a Pilgrim on unceasing prayer",
        [
          {
            "title": "The Way of a Pilgrim, tr. R. M. French (Philip Allan, 1931), on CCEL",
            "url": "https://www.ccel.org/ccel/p/philip_allan/pilgrim",
            "note": "The full text the lesson quotes; CCEL lists it as public domain."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Unceasing prayer",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/unceasing-prayer",
            "note": "Free."
          }
        ]
      ],
      [
        "Hesychasm: stillness and the prayer of the heart",
        [
          {
            "title": "OrthodoxWiki: Hesychasm",
            "url": "https://orthodoxwiki.org/Hesychasm",
            "note": "The practice and the fourteenth-century councils."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The fourteenth century",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourteenth-century",
            "note": "The hesychast controversy in the OCA's church history. Free."
          }
        ]
      ],
      [
        "The nous and the heart",
        [
          {
            "title": "OrthodoxWiki: Nous",
            "url": "https://orthodoxwiki.org/Nous",
            "note": "The term in the Fathers."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Man",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/man1",
            "note": "The human person in Orthodox teaching. Free."
          }
        ]
      ],
      [
        "Watchfulness: nepsis and the guarding of the heart",
        [
          {
            "title": "OrthodoxWiki: Philokalia",
            "url": "https://orthodoxwiki.org/Philokalia",
            "note": "The 'neptic' Fathers and their writings."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Meditation",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/meditation",
            "note": "Free."
          }
        ]
      ],
      [
        "How a thought becomes a sin: the stages of temptation",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Sin",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/sin1",
            "note": "Free."
          },
          {
            "title": "St John Climacus, The Ladder of Divine Ascent, tr. Archimandrite Lazarus Moore",
            "note": "Printed book (Lazarus Moore's translation, 1959); Step 15 gives the stages of temptation."
          }
        ]
      ],
      [
        "The passions and the eight evil thoughts",
        [
          {
            "title": "John Cassian, Institutes, books 5–12, tr. C. S. Gibson, NPNF 2nd ser. vol. 11 (1894)",
            "url": "https://www.newadvent.org/fathers/3507.htm",
            "note": "Public domain. Cassian's treatment of the eight principal faults, from the desert."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The world and the flesh",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/the-world-and-the-flesh",
            "note": "Free."
          }
        ]
      ],
      [
        "Self-love: the root of the passions",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Humility",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-virtues/humility",
            "note": "Free."
          },
          {
            "title": "The Philokalia, vol. 2, tr. G. E. H. Palmer, Philip Sherrard and Kallistos Ware",
            "note": "Printed book; contains St Maximus's Four Hundred Texts on Love."
          }
        ]
      ],
      [
        "The virtues: love, discernment and dispassion",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The virtues",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-virtues/the-virtues",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The greatest virtue is love",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-greatest-virtue-is-love",
            "note": "Free."
          },
          {
            "title": "John Cassian, Conference 2 (On Discretion), tr. C. S. Gibson, NPNF 2nd ser. vol. 11 (1894)",
            "url": "https://www.newadvent.org/fathers/350802.htm",
            "note": "Public domain. The source of the lesson's quotation (ch. 4)."
          }
        ]
      ],
      [
        "Fasting: why the Church fasts, and how",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Fasting",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/fasting",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Fasting",
            "url": "https://orthodoxwiki.org/Fasting",
            "note": "The fasting calendar and rules."
          }
        ]
      ],
      [
        "Almsgiving and the love of the poor",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Almsgiving",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/prayer-fasting-and-almsgiving/almsgiving",
            "note": "Free."
          },
          {
            "title": "St John Chrysostom, Homily 50 on Matthew, tr. G. Prevost, rev. M. B. Riddle, NPNF 1st ser. vol. 10 (1888)",
            "url": "https://www.newadvent.org/fathers/200150.htm",
            "note": "Public domain. The source of the lesson's quotation."
          }
        ]
      ],
      [
        "Repentance: metanoia, mourning and tears",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The Beatitudes",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-beatitudes",
            "note": "Includes 'Blessed are they that mourn'. Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: The church year",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-church-year",
            "note": "The Lenten services of repentance. Free."
          }
        ]
      ],
      [
        "Confession in practice",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Penance",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/penance",
            "note": "The Mystery of confession in the OCA's catechism. Free."
          },
          {
            "title": "OrthodoxWiki: Confession",
            "url": "https://orthodoxwiki.org/Confession",
            "note": "Practice and history."
          }
        ]
      ],
      [
        "Spiritual fathers, elders and obedience",
        [
          {
            "title": "OrthodoxWiki: Geronta (Elder)",
            "url": "https://orthodoxwiki.org/Elder",
            "note": "Elders and eldership."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Obedience",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/the-virtues/obedience",
            "note": "Free."
          }
        ]
      ],
      [
        "Prelest: spiritual delusion",
        [
          {
            "title": "OrthodoxWiki: Prelest",
            "url": "https://orthodoxwiki.org/Prelest",
            "note": "Delusion in the Fathers and St Ignatius Brianchaninov."
          },
          {
            "title": "St Ignatius Brianchaninov, The Arena, tr. Archimandrite Lazarus Moore",
            "note": "Printed book; the classic Russian treatment of the dangers of the spiritual life."
          }
        ]
      ],
      [
        "Spiritual warfare and the unseen enemy",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: The devil",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/orthodox-spirituality/the-devil",
            "note": "Free."
          },
          {
            "title": "St Athanasius, Life of Antony, tr. H. Ellershaw, NPNF 2nd ser. vol. 4 (1892)",
            "url": "https://www.newadvent.org/fathers/2811.htm",
            "note": "Public domain. Antony's struggles with the demons."
          },
          {
            "title": "Unseen Warfare, ed. Nikodemos and Theophan, tr. E. Kadloubovsky and G. E. H. Palmer",
            "note": "Printed book."
          }
        ]
      ],
      [
        "The Philokalia: the anthology of the neptic Fathers",
        [
          {
            "title": "OrthodoxWiki: Philokalia",
            "url": "https://orthodoxwiki.org/Philokalia",
            "note": "Contents, compilers and editions."
          },
          {
            "title": "OrthodoxWiki: Nicodemus the Hagiorite",
            "url": "https://orthodoxwiki.org/Nicodemus_the_Hagiorite",
            "note": "The chief compiler."
          },
          {
            "title": "The Philokalia, tr. G. E. H. Palmer, Philip Sherrard and Kallistos Ware",
            "note": "Printed volumes, from 1979."
          }
        ]
      ],
      [
        "The Ladder of Divine Ascent: St John of Sinai",
        [
          {
            "title": "OrthodoxWiki: John Climacus",
            "url": "https://orthodoxwiki.org/John_Climacus",
            "note": "Life and feasts."
          },
          {
            "title": "OrthodoxWiki: The Ladder of Divine Ascent",
            "url": "https://orthodoxwiki.org/The_Ladder_of_Divine_Ascent",
            "note": "The thirty steps."
          },
          {
            "title": "St John Climacus, The Ladder of Divine Ascent, tr. Archimandrite Lazarus Moore",
            "note": "Printed book (1959)."
          }
        ]
      ],
      [
        "Monasticism: its beginnings and its forms",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Monasticism (fourth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fourth-century/monasticism1",
            "note": "Free."
          },
          {
            "title": "St Athanasius, Life of Antony, tr. H. Ellershaw, NPNF 2nd ser. vol. 4 (1892)",
            "url": "https://www.newadvent.org/fathers/2811.htm",
            "note": "Public domain. The source of the lesson's quotation (ch. 3)."
          },
          {
            "title": "OrthodoxWiki: Anthony the Great",
            "url": "https://orthodoxwiki.org/Anthony_the_Great",
            "note": "Life and dates."
          }
        ]
      ],
      [
        "Monastic vows and the monastic day",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 2: Monasticism",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/worship/the-sacraments/monasticism",
            "note": "The monastic tonsure among the sacramental services. Free."
          },
          {
            "title": "OrthodoxWiki: Monasticism",
            "url": "https://orthodoxwiki.org/Monasticism",
            "note": "Degrees and vows."
          }
        ]
      ],
      [
        "Mount Athos: the Holy Mountain",
        [
          {
            "title": "OrthodoxWiki: Mount Athos",
            "url": "https://orthodoxwiki.org/Mount_Athos",
            "note": "History, monasteries and government."
          },
          {
            "title": "Graham Speake, Mount Athos: Renewal in Paradise",
            "note": "Printed book by Graham Speake; history of the Holy Mountain and its modern renewal."
          }
        ]
      ],
      [
        "The Russian elders: Paisius Velichkovsky, Sarov and Optina",
        [
          {
            "title": "OrthodoxWiki: Paisius Velichkovsky",
            "url": "https://orthodoxwiki.org/Paisius_Velichkovsky",
            "note": "Life and translation work."
          },
          {
            "title": "OrthodoxWiki: Optina Monastery",
            "url": "https://orthodoxwiki.org/Optina_Monastery",
            "note": "The elders and the monastery's history."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Russia: spiritual renewal",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/nineteenth-century/russia-spiritual-renewal",
            "note": "Free."
          }
        ]
      ],
      [
        "The spiritual life in the world: family, work and the domestic church",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Sexuality, marriage and family",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality/sexuality-marriage-and-family",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Theophan the Recluse",
            "url": "https://orthodoxwiki.org/Theophan_the_Recluse",
            "note": "His letters on the spiritual life for lay people."
          },
          {
            "title": "OrthodoxWiki: John of Kronstadt",
            "url": "https://orthodoxwiki.org/John_of_Kronstadt",
            "note": "A married parish priest's life of prayer."
          }
        ]
      ],
      [
        "Looking back: one road from baptism to the vision of God",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 4: Spirituality (contents)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/spirituality",
            "note": "The whole volume, as a review. Free."
          },
          {
            "title": "Kallistos Ware, The Orthodox Way",
            "note": "Printed book by Metropolitan Kallistos Ware."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 11 · The Church across the world",
    "lessons": [
      [
        "Context: one Church in many lands after 1453",
        [
          {
            "title": "OrthodoxWiki: Autocephaly",
            "url": "https://orthodoxwiki.org/Autocephaly",
            "note": "The local churches and their status."
          },
          {
            "title": "OrthodoxWiki: Diptychs",
            "url": "https://orthodoxwiki.org/Diptychs",
            "note": "The order of precedence, and where the lists differ."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book by Metropolitan Kallistos Ware; Part I tells this history in outline."
          }
        ]
      ],
      [
        "The Patriarchate under the Ottomans: the Rum millet",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The establishment of the Rum millet",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifteenth-century/the-establishment-of-the-rum-milet",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The Greek Orthodox under the Ottoman Turks",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixteenth-century/the-greek-orthodox-under-the-ottoman-turks",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Gennadius Scholarius",
            "url": "https://orthodoxwiki.org/Gennadius_Scholarius",
            "note": "The first patriarch under Ottoman rule."
          }
        ]
      ],
      [
        "The neomartyrs of the Ottoman centuries",
        [
          {
            "title": "OrthodoxWiki: Kosmas Aitolos",
            "url": "https://orthodoxwiki.org/Kosmas_Aitolos",
            "note": "Life of St Kosmas of Aitolia."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The Greek Church (eighteenth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/eighteenth-century/the-greek-church",
            "note": "Free."
          }
        ]
      ],
      [
        "The Orthodox confessions of the seventeenth century",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Cyril Lukaris",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventeenth-century/cyril-lukaris",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Saint Peter Mogila",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventeenth-century/saint-peter-mogila",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Patriarch Jeremias II and the dialogue with the Lutherans",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixteenth-century/patriarch-jeremias-ii-and-the-dialogue-with-the-lutherans",
            "note": "Free."
          }
        ]
      ],
      [
        "The Kollyvades and the patristic revival",
        [
          {
            "title": "OrthodoxWiki: Nicodemus the Hagiorite",
            "url": "https://orthodoxwiki.org/Nicodemus_the_Hagiorite",
            "note": "The movement's chief editor."
          },
          {
            "title": "OrthodoxWiki: Philokalia",
            "url": "https://orthodoxwiki.org/Philokalia",
            "note": "The Kollyvades' great anthology."
          }
        ]
      ],
      [
        "Reading: the Encyclical of the Eastern Patriarchs (1848)",
        [
          {
            "title": "Encyclical of the Eastern Patriarchs, 1848 (Orthodox Christian Information Center)",
            "url": "http://orthodoxinfo.com/ecumenism/encyc_1848.aspx",
            "note": "The full English text the lesson quotes; translator not named."
          },
          {
            "title": "Encyclical of the Eastern Patriarchs, 1848 (Internet Modern History Sourcebook, Fordham)",
            "url": "https://sourcebooks.fordham.edu/mod/1848orthodoxencyclical.asp",
            "note": "The same translation, checked against the first."
          },
          {
            "title": "OrthodoxWiki: Encyclical of the Eastern Patriarchs",
            "url": "https://orthodoxwiki.org/Encyclical_of_the_Eastern_Patriarchs",
            "note": "Background and signatories."
          }
        ]
      ],
      [
        "The baptism of Rus' (988)",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Saint Vladimir of Kiev",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/tenth-century/saint-vladimir-of-kiev",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Vladimir of Kiev",
            "url": "https://orthodoxwiki.org/Vladimir_of_Kiev",
            "note": "Life and feast."
          },
          {
            "title": "OrthodoxWiki: Olga of Kiev",
            "url": "https://orthodoxwiki.org/Olga_of_Kiev",
            "note": "Life and feast."
          }
        ]
      ],
      [
        "Kievan Rus' and the Mongol age: the Caves, Radonezh and Moscow",
        [
          {
            "title": "OrthodoxWiki: Kiev Pechersk Lavra",
            "url": "https://orthodoxwiki.org/Kiev_Pechersk_Lavra",
            "note": "The Caves monastery."
          },
          {
            "title": "OrthodoxWiki: Sergius of Radonezh",
            "url": "https://orthodoxwiki.org/Sergius_of_Radonezh",
            "note": "Life and legacy."
          },
          {
            "title": "OrthodoxWiki: Joseph of Volokolamsk",
            "url": "https://orthodoxwiki.org/Joseph_of_Volokolamsk",
            "note": "The possessors' leader."
          }
        ]
      ],
      [
        "Moscow as patriarchate, and the Third Rome",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Russia (fifteenth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/fifteenth-century/russia2",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Russia (sixteenth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixteenth-century/russia3",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The Union of Brest-Litovsk",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/sixteenth-century/the-union-of-brest-litovsk",
            "note": "Free."
          }
        ]
      ],
      [
        "Patriarch Nikon and the Old Believers",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Russia (seventeenth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/seventeenth-century/russia4",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Old Believers",
            "url": "https://orthodoxwiki.org/Old_Believers",
            "note": "History and groups."
          },
          {
            "title": "OrthodoxWiki: Nikon of Moscow",
            "url": "https://orthodoxwiki.org/Nikon_of_Moscow",
            "note": "The patriarch and his reforms."
          }
        ]
      ],
      [
        "The Synodal period of the Russian Church (1721–1917)",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Russia (eighteenth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/eighteenth-century/russia5",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Russia: spiritual renewal",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/nineteenth-century/russia-spiritual-renewal",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Philaret (Drozdov) of Moscow",
            "url": "https://orthodoxwiki.org/Philaret_(Drozdov)_of_Moscow",
            "note": "Life and catechism."
          }
        ]
      ],
      [
        "Missions to the east: Alaska, Siberia and Japan",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Mission to Alaska",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/eighteenth-century/mission-to-alaska",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Russia: missionary activity",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/nineteenth-century/russia-missionary-activity",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Nicholas of Japan",
            "url": "https://orthodoxwiki.org/Nicholas_of_Japan",
            "note": "Life of the apostle of Japan."
          }
        ]
      ],
      [
        "The Serbian Church: from St Sava to the restored patriarchate",
        [
          {
            "title": "OrthodoxWiki: Church of Serbia",
            "url": "https://orthodoxwiki.org/Church_of_Serbia",
            "note": "History and present."
          },
          {
            "title": "OrthodoxWiki: Sava of Serbia",
            "url": "https://orthodoxwiki.org/Sava_of_Serbia",
            "note": "Life of St Sava."
          },
          {
            "title": "OrthodoxWiki: Lazar of Serbia",
            "url": "https://orthodoxwiki.org/Lazar_of_Serbia",
            "note": "Kosovo, 1389."
          }
        ]
      ],
      [
        "The Bulgarian and Romanian churches",
        [
          {
            "title": "OrthodoxWiki: Church of Bulgaria",
            "url": "https://orthodoxwiki.org/Church_of_Bulgaria",
            "note": "History and present."
          },
          {
            "title": "OrthodoxWiki: Church of Romania",
            "url": "https://orthodoxwiki.org/Church_of_Romania",
            "note": "History and present."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Eastern Europe and Greece (nineteenth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/nineteenth-century/eastern-europe-and-greece",
            "note": "Free."
          }
        ]
      ],
      [
        "The churches of Greece, Cyprus and Albania",
        [
          {
            "title": "OrthodoxWiki: Church of Greece",
            "url": "https://orthodoxwiki.org/Church_of_Greece",
            "note": "History and organisation."
          },
          {
            "title": "OrthodoxWiki: Church of Cyprus",
            "url": "https://orthodoxwiki.org/Church_of_Cyprus",
            "note": "History and privileges."
          },
          {
            "title": "OrthodoxWiki: Anastasios (Yannoulatos) of Tirana",
            "url": "https://orthodoxwiki.org/Anastasios_(Yannoulatos)_of_Tirana",
            "note": "The rebuilder of the Albanian Church."
          }
        ]
      ],
      [
        "The smaller churches: Poland, the Czech Lands and Slovakia, Finland, Estonia and Moldova",
        [
          {
            "title": "OrthodoxWiki: Church of Poland",
            "url": "https://orthodoxwiki.org/Church_of_Poland",
            "note": "History and present."
          },
          {
            "title": "OrthodoxWiki: Church of the Czech Lands and Slovakia",
            "url": "https://orthodoxwiki.org/Church_of_the_Czech_Lands_and_Slovakia",
            "note": "History, St Gorazd, autocephaly."
          },
          {
            "title": "OrthodoxWiki: Church of Finland",
            "url": "https://orthodoxwiki.org/Church_of_Finland",
            "note": "Autonomy and New Valaam."
          }
        ]
      ],
      [
        "The Church of Georgia",
        [
          {
            "title": "OrthodoxWiki: Church of Georgia",
            "url": "https://orthodoxwiki.org/Church_of_Georgia",
            "note": "History from St Nino to the present."
          },
          {
            "title": "OrthodoxWiki: Ilia II of Georgia",
            "url": "https://orthodoxwiki.org/Ilia_II_of_Georgia",
            "note": "The patriarch of the revival (1977–2026)."
          }
        ]
      ],
      [
        "Antioch in the Arab world",
        [
          {
            "title": "OrthodoxWiki: Church of Antioch",
            "url": "https://orthodoxwiki.org/Church_of_Antioch",
            "note": "History and present."
          },
          {
            "title": "OrthodoxWiki: Raphael of Brooklyn",
            "url": "https://orthodoxwiki.org/Raphael_of_Brooklyn",
            "note": "Life of St Raphael."
          },
          {
            "title": "OrthodoxWiki: Meletius II (Doumani) of Antioch",
            "url": "https://orthodoxwiki.org/Meletius_II_(Doumani)_of_Antioch",
            "note": "The first modern Arab patriarch, 1899."
          }
        ]
      ],
      [
        "Alexandria and Jerusalem today",
        [
          {
            "title": "OrthodoxWiki: Church of Alexandria",
            "url": "https://orthodoxwiki.org/Church_of_Alexandria",
            "note": "History and the African mission."
          },
          {
            "title": "OrthodoxWiki: Church of Jerusalem",
            "url": "https://orthodoxwiki.org/Church_of_Jerusalem",
            "note": "History and the Brotherhood of the Holy Sepulchre."
          },
          {
            "title": "OrthodoxWiki: Church of Sinai",
            "url": "https://orthodoxwiki.org/Church_of_Sinai",
            "note": "The autonomous church of St Catherine's."
          }
        ]
      ],
      [
        "The Russian Church under Soviet rule (1917–1991)",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The Orthodox Church in Russia (twentieth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century/the-orthodox-church-in-russia",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Sergius (Stragorodsky) of Moscow",
            "url": "https://orthodoxwiki.org/Sergius_(Stragorodsky)_of_Moscow",
            "note": "The 1927 Declaration and its reception."
          },
          {
            "title": "OrthodoxWiki: Russian Orthodox Church Outside Russia",
            "url": "https://orthodoxwiki.org/Russian_Orthodox_Church_Outside_Russia",
            "note": "ROCOR's history and the 2007 reunion."
          }
        ]
      ],
      [
        "The new martyrs and confessors of the twentieth century",
        [
          {
            "title": "OrthodoxWiki: New Martyrs and Confessors of Russia",
            "url": "https://orthodoxwiki.org/New_Martyrs_and_Confessors_of_Russia",
            "note": "The Russian new martyrs."
          },
          {
            "title": "OrthodoxWiki: Elizabeth the New Martyr",
            "url": "https://orthodoxwiki.org/Elizabeth_the_New_Martyr",
            "note": "Life of St Elizabeth."
          },
          {
            "title": "OrthodoxWiki: Luke (Voino-Yasenetsky) of Simferopol",
            "url": "https://orthodoxwiki.org/Luke_(Voino-Yasenetsky)_of_Simferopol",
            "note": "Surgeon, bishop and confessor."
          }
        ]
      ],
      [
        "Rebirth after communism, and the Ecumenical Patriarchate today",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The Ecumenical Patriarchate (twentieth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century/the-ecumenical-patriarchate",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Other Orthodox churches (twentieth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century/other-orthodox-churches",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Church of Constantinople",
            "url": "https://orthodoxwiki.org/Church_of_Constantinople",
            "note": "The Patriarchate's jurisdiction today."
          }
        ]
      ],
      [
        "The diaspora: Orthodoxy in Western Europe, Australia and beyond",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Western Europe and America (nineteenth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/nineteenth-century/western-europe-and-america",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Assembly of Canonical Orthodox Bishops of the United States of America",
            "url": "https://orthodoxwiki.org/Assembly_of_Canonical_Orthodox_Bishops_of_the_United_States_of_America",
            "note": "The first of the Episcopal Assemblies set up at Chambésy in 2009."
          },
          {
            "title": "OrthodoxWiki: Maria Skobtsova",
            "url": "https://orthodoxwiki.org/Maria_Skobtsova",
            "note": "St Maria of Paris."
          }
        ]
      ],
      [
        "The OCA and Orthodoxy in North America",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Orthodoxy in America, part one: from the Russian mission to the OCA",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century/orthodoxy-in-america-part-one-from-the-russian-mission-to-the-oca",
            "note": "Free."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Orthodoxy in America, part two: other Orthodox jurisdictions",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century/orthodoxy-in-america-part-two-other-orthodox-jurisdictions",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Alexis Toth",
            "url": "https://orthodoxwiki.org/Alexis_Toth",
            "note": "Life of St Alexis."
          }
        ]
      ],
      [
        "The calendar question: Julian, Revised Julian and the date of Pascha",
        [
          {
            "title": "OrthodoxWiki: Revised Julian Calendar",
            "url": "https://orthodoxwiki.org/Revised_Julian_Calendar",
            "note": "The 1923 reform and who uses it."
          },
          {
            "title": "OrthodoxWiki: Julian Calendar",
            "url": "https://orthodoxwiki.org/Julian_Calendar",
            "note": "The calendar and the Paschalion."
          },
          {
            "title": "OrthodoxWiki: Meletius IV (Metaxakis) of Constantinople",
            "url": "https://orthodoxwiki.org/Meletius_IV_(Metaxakis)_of_Constantinople",
            "note": "The patriarch who called the 1923 congress."
          }
        ]
      ],
      [
        "The Old Calendarists: the case for separation and the case against",
        [
          {
            "title": "OrthodoxWiki: Old Calendarists",
            "url": "https://orthodoxwiki.org/Old_Calendarists",
            "note": "History and the main synods."
          },
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: The Church in Greece (twentieth century)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century/the-church-in-greece",
            "note": "Free; includes the calendar change of 1924."
          }
        ]
      ],
      [
        "Autocephaly: how a church becomes self-headed, and the disputes it causes",
        [
          {
            "title": "OrthodoxWiki: Autocephaly",
            "url": "https://orthodoxwiki.org/Autocephaly",
            "note": "Principles and history."
          },
          {
            "title": "OrthodoxWiki: Tomos",
            "url": "https://orthodoxwiki.org/Tomos",
            "note": "The decree of autocephaly."
          },
          {
            "title": "OrthodoxWiki: Canonical territory",
            "url": "https://orthodoxwiki.org/Canonical_territory",
            "note": "The disputed concept."
          }
        ]
      ],
      [
        "Looking back: one Church in many lands",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Church History (contents)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history",
            "note": "The whole volume, as a review. Free."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book by Metropolitan Kallistos Ware."
          }
        ]
      ]
    ]
  },
  {
    "name": "Stage 12 · Modern Orthodox theology and the Church today",
    "lessons": [
      [
        "Context: Orthodox theology meets the modern world",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Twentieth century",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century",
            "note": "The OCA's survey of the period. Free."
          },
          {
            "title": "Andrew Louth, Modern Orthodox Thinkers: From the Philokalia to the Present",
            "note": "Printed book by Andrew Louth; a chapter on each of the theologians in this stage."
          }
        ]
      ],
      [
        "Khomiakov, the Slavophiles and sobornost",
        [
          {
            "title": "Wikipedia: Aleksey Khomyakov",
            "url": "https://en.wikipedia.org/wiki/Aleksey_Khomyakov",
            "note": "Life and ideas."
          },
          {
            "title": "Wikipedia: Sobornost",
            "url": "https://en.wikipedia.org/wiki/Sobornost",
            "note": "The term and its history."
          }
        ]
      ],
      [
        "Reading: Khomiakov on the Church as one body",
        [
          {
            "title": "W. J. Birkbeck, Russia and the English Church during the Last Fifty Years, vol. 1 (1895), on the Internet Archive",
            "url": "https://archive.org/details/russiaandtheengl00birkiala",
            "note": "Public domain. Chapter 23 is Birkbeck's translation of Khomiakov's essay, quoted in the lesson."
          },
          {
            "title": "Wikipedia: Aleksey Khomyakov",
            "url": "https://en.wikipedia.org/wiki/Aleksey_Khomyakov",
            "note": "Background to the essay."
          }
        ]
      ],
      [
        "The Russian religious renaissance and Fr Sergius Bulgakov",
        [
          {
            "title": "OrthodoxWiki: Sergius Bulgakov",
            "url": "https://orthodoxwiki.org/Sergius_Bulgakov",
            "note": "Life and works."
          },
          {
            "title": "Wikipedia: Sophiology",
            "url": "https://en.wikipedia.org/wiki/Sophiology",
            "note": "The teaching and the 1935 controversy."
          }
        ]
      ],
      [
        "Florovsky and the neo-patristic synthesis",
        [
          {
            "title": "OrthodoxWiki: Georges Florovsky",
            "url": "https://orthodoxwiki.org/Georges_Florovsky",
            "note": "Life and programme."
          },
          {
            "title": "Georges Florovsky, Bible, Church, Tradition: An Eastern Orthodox View (Collected Works, vol. 1)",
            "note": "Printed book by Fr Georges Florovsky; essays on Tradition and the Fathers."
          }
        ]
      ],
      [
        "Vladimir Lossky and the mystical theology of the Eastern Church",
        [
          {
            "title": "OrthodoxWiki: Vladimir Lossky",
            "url": "https://orthodoxwiki.org/Vladimir_Lossky",
            "note": "Life and works."
          },
          {
            "title": "Vladimir Lossky, The Mystical Theology of the Eastern Church",
            "note": "Printed book by Vladimir Lossky (French 1944, English 1957)."
          }
        ]
      ],
      [
        "Schmemann, Afanasiev and liturgical theology",
        [
          {
            "title": "OrthodoxWiki: Alexander Schmemann",
            "url": "https://orthodoxwiki.org/Alexander_Schmemann",
            "note": "Life and works."
          },
          {
            "title": "OrthodoxWiki: Nicholas Afanasiev",
            "url": "https://orthodoxwiki.org/Nicholas_Afanasiev",
            "note": "Eucharistic ecclesiology."
          },
          {
            "title": "Alexander Schmemann, For the Life of the World",
            "note": "Printed book by Fr Alexander Schmemann (1963)."
          }
        ]
      ],
      [
        "Meyendorff and the recovery of St Gregory Palamas",
        [
          {
            "title": "OrthodoxWiki: John Meyendorff",
            "url": "https://orthodoxwiki.org/John_Meyendorff",
            "note": "Life and works."
          },
          {
            "title": "John Meyendorff, Byzantine Theology",
            "note": "Printed book by Fr John Meyendorff (1974)."
          }
        ]
      ],
      [
        "St Dumitru Stăniloae",
        [
          {
            "title": "OrthodoxWiki: Dumitru Staniloae",
            "url": "https://orthodoxwiki.org/Dumitru_Staniloae",
            "note": "Life and works."
          },
          {
            "title": "Dumitru Stăniloae, The Experience of God (Orthodox Dogmatic Theology), vol. 1",
            "note": "Printed book by Fr Dumitru Stăniloae, in English translation."
          }
        ]
      ],
      [
        "John Zizioulas: being as communion",
        [
          {
            "title": "OrthodoxWiki: John (Zizioulas) of Pergamon",
            "url": "https://orthodoxwiki.org/John_(Zizioulas)_of_Pergamon",
            "note": "Life and works."
          },
          {
            "title": "John Zizioulas, Being as Communion",
            "note": "Printed book by Metropolitan John Zizioulas (1985)."
          }
        ]
      ],
      [
        "Yannaras, Romanides and the Greek theology of the 1960s",
        [
          {
            "title": "OrthodoxWiki: Christos Yannaras",
            "url": "https://orthodoxwiki.org/Christos_Yannaras",
            "note": "Life and works."
          },
          {
            "title": "Wikipedia: John Romanides",
            "url": "https://en.wikipedia.org/wiki/John_Romanides",
            "note": "Life, works and debates."
          },
          {
            "title": "Christos Yannaras, Elements of Faith",
            "note": "Printed book by Christos Yannaras; a short introduction to Orthodox doctrine."
          }
        ]
      ],
      [
        "St Justin Popović",
        [
          {
            "title": "OrthodoxWiki: Justin Popovich",
            "url": "https://orthodoxwiki.org/Justin_Popovich",
            "note": "Life and works."
          },
          {
            "title": "Wikipedia: Justin Popović",
            "url": "https://en.wikipedia.org/wiki/Justin_Popovi%C4%87",
            "note": "Life, works and glorification."
          }
        ]
      ],
      [
        "Fr Seraphim Rose",
        [
          {
            "title": "OrthodoxWiki: Seraphim (Rose)",
            "url": "https://orthodoxwiki.org/Seraphim_(Rose)",
            "note": "Life, works and the toll-house debate."
          },
          {
            "title": "OrthodoxWiki: John Maximovitch",
            "url": "https://orthodoxwiki.org/John_Maximovitch",
            "note": "St John of Shanghai and San Francisco, his spiritual father."
          }
        ]
      ],
      [
        "St Silouan the Athonite",
        [
          {
            "title": "OrthodoxWiki: Silouan the Athonite",
            "url": "https://orthodoxwiki.org/Silouan_the_Athonite",
            "note": "Life and teaching."
          },
          {
            "title": "Archimandrite Sophrony, Saint Silouan the Athonite",
            "note": "Printed book by St Sophrony (Sakharov): Silouan's writings with his study."
          }
        ]
      ],
      [
        "St Sophrony of Essex",
        [
          {
            "title": "OrthodoxWiki: Sophrony (Sakharov)",
            "url": "https://orthodoxwiki.org/Sophrony_(Sakharov)",
            "note": "Life and works."
          },
          {
            "title": "Archimandrite Sophrony, His Life Is Mine",
            "note": "Printed book by St Sophrony (Sakharov)."
          }
        ]
      ],
      [
        "St Paisios the Athonite",
        [
          {
            "title": "OrthodoxWiki: Paisios of Mount Athos",
            "url": "https://orthodoxwiki.org/Paisios_of_Mount_Athos",
            "note": "Life and glorification."
          },
          {
            "title": "Elder Paisios of Mount Athos, Spiritual Counsels, vol. 1: With Pain and Love for Contemporary Man",
            "note": "Printed book, published by the Holy Monastery of St John the Theologian, Souroti."
          }
        ]
      ],
      [
        "St Porphyrios of Kafsokalyvia",
        [
          {
            "title": "Wikipedia: Porphyrios of Kafsokalyvia",
            "url": "https://en.wikipedia.org/wiki/Porphyrios_of_Kafsokalyvia",
            "note": "Life and glorification."
          },
          {
            "title": "Elder Porphyrios, Wounded by Love",
            "note": "Printed book, compiled by the Holy Convent of the Life-Giving Spring, Chrysopigi."
          }
        ]
      ],
      [
        "The Orthodox in the ecumenical movement",
        [
          {
            "title": "Hopko, The Orthodox Faith, vol. 3: Ecumenical movement",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history/twentieth-century/ecumenical-movement",
            "note": "Free."
          },
          {
            "title": "OrthodoxWiki: Ecumenism",
            "url": "https://orthodoxwiki.org/Ecumenism",
            "note": "The Orthodox positions."
          },
          {
            "title": "Holy and Great Council: Relations of the Orthodox Church with the Rest of the Christian World",
            "url": "https://www.holycouncil.org/-/rest-of-christian-world",
            "note": "The official text of 2016."
          }
        ]
      ],
      [
        "The dialogue with the Oriental Orthodox churches",
        [
          {
            "title": "OrthodoxWiki: Oriental Orthodoxy",
            "url": "https://orthodoxwiki.org/Oriental_Orthodoxy",
            "note": "The churches and the dialogue."
          },
          {
            "title": "Wikipedia: Oriental Orthodox Churches",
            "url": "https://en.wikipedia.org/wiki/Oriental_Orthodox_Churches",
            "note": "The churches today, with the dialogue in outline."
          }
        ]
      ],
      [
        "The Holy and Great Council of 2016",
        [
          {
            "title": "Holy and Great Council: official documents",
            "url": "https://www.holycouncil.org/documents",
            "note": "All the texts of the Council."
          },
          {
            "title": "Wikipedia: Pan-Orthodox Council (the Holy and Great Council of 2016)",
            "url": "https://en.wikipedia.org/wiki/Holy_and_Great_Council_of_the_Orthodox_Church",
            "note": "Preparation, participants and reception."
          }
        ]
      ],
      [
        "Ukraine: the road to the 2018–19 break",
        [
          {
            "title": "OrthodoxWiki: Orthodox Church of Ukraine",
            "url": "https://orthodoxwiki.org/Orthodox_Church_of_Ukraine",
            "note": "The 2018–19 events."
          },
          {
            "title": "Wikipedia: 2018 Moscow–Constantinople schism",
            "url": "https://en.wikipedia.org/wiki/2018_Moscow%E2%80%93Constantinople_schism",
            "note": "Chronology and the churches' positions."
          }
        ]
      ],
      [
        "Ukraine as of November 2026: the churches, the war and the law",
        [
          {
            "title": "Wikipedia: Ukrainian Orthodox Church (Moscow Patriarchate)",
            "url": "https://en.wikipedia.org/wiki/Ukrainian_Orthodox_Church_(Moscow_Patriarchate)",
            "note": "The UOC since 1990, the 2022 council and the 2024 law."
          },
          {
            "title": "Sud.ua: Court postponed the hearing on the termination of the Kyiv Metropolis of the UOC",
            "url": "https://sud.ua/en/news/sud-info/374244-sud-vidklav-rozhliad-spravy-shchodo-prypynennia-diialnosti-kyivskoi-mytropolii-upts",
            "note": "Ukrainian legal news, October 2026: the indefinite postponement."
          },
          {
            "title": "OrthoChristian: Court annuls state examination that declared UOC is part of the Moscow Patriarchate",
            "url": "https://orthochristian.com/177280.html",
            "note": "April 2026 ruling, reported from the UOC's side."
          }
        ]
      ],
      [
        "Orthodoxy in Africa",
        [
          {
            "title": "OrthodoxWiki: Christopher (Spartas) of Nilopolis",
            "url": "https://orthodoxwiki.org/Christopher_(Spartas)_of_Nilopolis",
            "note": "Reuben Spartas, the Ugandan founder, later bishop."
          },
          {
            "title": "OrthodoxWiki: Church of Alexandria",
            "url": "https://orthodoxwiki.org/Church_of_Alexandria",
            "note": "The Patriarchate and its African dioceses."
          },
          {
            "title": "Wikipedia: Patriarchal Exarchate of Africa",
            "url": "https://en.wikipedia.org/wiki/Patriarchal_Exarchate_of_Africa",
            "note": "Moscow's exarchate and Alexandria's response."
          }
        ]
      ],
      [
        "Social teaching: the Church and the modern world",
        [
          {
            "title": "Moscow Patriarchate: The Basis of the Social Concept",
            "url": "https://old.mospat.ru/en/documents/social-concepts/",
            "note": "The 2000 document, in English."
          },
          {
            "title": "For the Life of the World: Toward a Social Ethos of the Orthodox Church (2020)",
            "note": "Document of a commission of Orthodox theologians, published by the Greek Orthodox Archdiocese of America with the Ecumenical Patriarchate's blessing; free online at goarch.org, though that site refused automated checking."
          },
          {
            "title": "Holy and Great Council: The Mission of the Orthodox Church in Today's World",
            "url": "https://www.holycouncil.org/-/mission-orthodox-church-todays-world",
            "note": "The 2016 text on the Church in society."
          }
        ]
      ],
      [
        "Other unfolding questions, as of November 2026",
        [
          {
            "title": "Wikipedia: Macedonian Orthodox Church – Archdiocese of Ohrid",
            "url": "https://en.wikipedia.org/wiki/Macedonian_Orthodox_Church_%E2%80%93_Archdiocese_of_Ohrid",
            "note": "The 2022 decisions and recognition."
          },
          {
            "title": "Wikipedia: Halki seminary",
            "url": "https://en.wikipedia.org/wiki/Halki_seminary",
            "note": "The school's closure and the reopening talks."
          }
        ]
      ],
      [
        "Looking back: the Church today, and the whole course",
        [
          {
            "title": "Hopko, The Orthodox Faith (all four volumes)",
            "url": "https://www.oca.org/orthodoxy/the-orthodox-faith",
            "note": "The OCA's catechism, as a review of the whole course. Free."
          },
          {
            "title": "Timothy (Kallistos) Ware, The Orthodox Church",
            "note": "Printed book by Metropolitan Kallistos Ware."
          }
        ]
      ]
    ]
  }
];

const out = [
  '-- Generated by scripts/curriculums/theology.mjs. Read before running.',
  '-- Apply it with `npm run curriculum theology`, which carries ticks,',
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
for (const key of strayDetail) console.error(`! theology-detail.json has no lesson: ${key}`);
for (const key of strayCards) console.error(`! theology-cards.json has no lesson: ${key}`);

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
