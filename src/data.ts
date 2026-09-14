export type Category =
  | "science"
  | "mathematics"
  | "engineering"
  | "music"
  | "art"
  | "literature"
  | "film"
  | "activism"
  | "politics"
  | "exploration";

export interface Person {
  id: string;
  name: string;
  deathAge: number;
  country: string;
  category: Category;
  summary: string;
  weight?: number;
}

export const categoryLabel: Record<Category, string> = {
  science: "Science",
  mathematics: "Mathematics",
  engineering: "Engineering",
  music: "Music",
  art: "Art",
  literature: "Literature",
  film: "Film",
  activism: "Activism",
  politics: "Politics",
  exploration: "Exploration",
};

export const people: Person[] = [
  { id: "iqbal-masih", name: "Iqbal Masih", deathAge: 12, country: "Pakistan", category: "activism", summary: "Escaped bonded labour and became an international campaigner against child exploitation.", weight: 2 },
  { id: "samantha-smith", name: "Samantha Smith", deathAge: 13, country: "USA", category: "activism", summary: "A schoolgirl whose letter to Yuri Andropov made her a young peace advocate during the Cold War." },
  { id: "anne-frank", name: "Anne Frank", deathAge: 15, country: "Netherlands", category: "literature", summary: "Her diary became one of the world's most widely read accounts of the Holocaust.", weight: 3 },
  { id: "thomas-chatterton", name: "Thomas Chatterton", deathAge: 17, country: "UK", category: "literature", summary: "Created a remarkable body of poetry and literary forgeries while still a teenager." },
  { id: "joan-of-arc", name: "Joan of Arc", deathAge: 19, country: "France", category: "politics", summary: "Became a military and political symbol during the final phases of the Hundred Years' War.", weight: 2 },
  { id: "evariste-galois", name: "Évariste Galois", deathAge: 20, country: "France", category: "mathematics", summary: "Developed ideas that became foundational to modern group theory and abstract algebra.", weight: 3 },
  { id: "sophie-scholl", name: "Sophie Scholl", deathAge: 21, country: "Germany", category: "activism", summary: "Helped lead the White Rose student resistance against the Nazi regime.", weight: 2 },
  { id: "georg-buchner", name: "Georg Büchner", deathAge: 23, country: "Germany", category: "literature", summary: "Wrote radical plays and prose that later became central to modern European literature." },
  { id: "christopher-mccandless", name: "Christopher McCandless", deathAge: 24, country: "USA", category: "exploration", summary: "His attempt to live alone in the Alaskan wilderness became a lasting story about freedom and risk." },
  { id: "john-keats", name: "John Keats", deathAge: 25, country: "UK", category: "literature", summary: "Produced some of the defining poems of English Romanticism in only a few years.", weight: 2 },
  { id: "charlotte-salomon", name: "Charlotte Salomon", deathAge: 26, country: "Germany", category: "art", summary: "Created the vast autobiographical painting cycle Life? or Theatre? while in exile." },
  { id: "nick-drake", name: "Nick Drake", deathAge: 26, country: "UK", category: "music", summary: "Recorded three intimate albums whose influence grew dramatically after his death." },
  { id: "amy-winehouse", name: "Amy Winehouse", deathAge: 27, country: "UK", category: "music", summary: "Released Back to Black, a defining album of 21st-century soul and pop.", weight: 2 },
  { id: "jimi-hendrix", name: "Jimi Hendrix", deathAge: 27, country: "USA", category: "music", summary: "Reimagined the electric guitar and changed the vocabulary of rock music.", weight: 2 },
  { id: "jean-michel-basquiat", name: "Jean-Michel Basquiat", deathAge: 27, country: "USA", category: "art", summary: "Brought an unmistakable visual language from New York's streets into the international art world.", weight: 2 },
  { id: "janis-joplin", name: "Janis Joplin", deathAge: 27, country: "USA", category: "music", summary: "Became one of the defining voices of late-1960s rock and blues." },
  { id: "brandon-lee", name: "Brandon Lee", deathAge: 28, country: "USA", category: "film", summary: "Became a cult film figure through The Crow, completed after his accidental death on set." },
  { id: "sylvia-plath", name: "Sylvia Plath", deathAge: 30, country: "USA", category: "literature", summary: "Produced a body of poetry and prose that profoundly shaped confessional literature.", weight: 2 },
  { id: "paula-modersohn-becker", name: "Paula Modersohn-Becker", deathAge: 31, country: "Germany", category: "art", summary: "Pioneered a radically direct modern style of portraiture and self-portraiture.", weight: 2 },
  { id: "franz-schubert", name: "Franz Schubert", deathAge: 31, country: "Austria", category: "music", summary: "Composed more than 600 songs alongside symphonies, chamber music and piano works.", weight: 3 },
  { id: "georges-seurat", name: "Georges Seurat", deathAge: 31, country: "France", category: "art", summary: "Developed pointillism and created A Sunday Afternoon on the Island of La Grande Jatte." },
  { id: "srinivasa-ramanujan", name: "Srinivasa Ramanujan", deathAge: 32, country: "India", category: "mathematics", summary: "Made extraordinary contributions to number theory, infinite series and mathematical analysis.", weight: 3 },
  { id: "alexander-the-great", name: "Alexander the Great", deathAge: 32, country: "Macedon", category: "politics", summary: "Built one of antiquity's largest empires, stretching from Greece to northwestern India." },
  { id: "bruce-lee", name: "Bruce Lee", deathAge: 32, country: "USA / Hong Kong", category: "film", summary: "Transformed the global image of martial arts through film, teaching and philosophy.", weight: 2 },
  { id: "katherine-mansfield", name: "Katherine Mansfield", deathAge: 34, country: "New Zealand", category: "literature", summary: "Helped transform the modern short story through compressed, psychologically precise fiction." },
  { id: "mozart", name: "Wolfgang Amadeus Mozart", deathAge: 35, country: "Austria", category: "music", summary: "Created an immense body of operas, concertos, symphonies and chamber music before 36.", weight: 3 },
  { id: "ada-lovelace", name: "Ada Lovelace", deathAge: 36, country: "UK", category: "mathematics", summary: "Described how Charles Babbage's Analytical Engine could manipulate symbols, not just numbers.", weight: 2 },
  { id: "franz-marc", name: "Franz Marc", deathAge: 36, country: "Germany", category: "art", summary: "Co-founded Der Blaue Reiter and became a central figure in German Expressionism." },
  { id: "rosalind-franklin", name: "Rosalind Franklin", deathAge: 37, country: "UK", category: "science", summary: "Produced crucial X-ray diffraction work on DNA and important research on viruses and carbon.", weight: 3 },
  { id: "martin-luther-king", name: "Martin Luther King Jr.", deathAge: 39, country: "USA", category: "activism", summary: "Led a mass nonviolent civil-rights movement and received the Nobel Peace Prize at 35.", weight: 3 },
  { id: "alan-turing", name: "Alan Turing", deathAge: 41, country: "UK", category: "mathematics", summary: "Laid foundations of computer science and played a major role in Allied wartime codebreaking.", weight: 3 },
  { id: "antoine-de-saint-exupery", name: "Antoine de Saint-Exupéry", deathAge: 44, country: "France", category: "literature", summary: "Combined pioneering aviation with literature, including The Little Prince." },
  { id: "albert-camus", name: "Albert Camus", deathAge: 46, country: "France", category: "literature", summary: "Wrote The Stranger and The Plague and received the Nobel Prize in Literature at 44.", weight: 2 },
  { id: "frida-kahlo", name: "Frida Kahlo", deathAge: 47, country: "Mexico", category: "art", summary: "Built an intensely personal visual language around identity, pain, politics and the body.", weight: 2 },
  { id: "marie-curie", name: "Marie Curie", deathAge: 66, country: "Poland / France", category: "science", summary: "Pioneered the study of radioactivity and became the first person to win two Nobel Prizes.", weight: 2 },
  { id: "grace-hopper", name: "Grace Hopper", deathAge: 85, country: "USA", category: "engineering", summary: "Helped pioneer compilers and made programming languages more accessible to humans." },
];
