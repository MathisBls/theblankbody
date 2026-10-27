import { SECTION_IDS } from '../../config/links';
import { AboutBlank } from '../../sections/AboutBlank/AboutBlank';
import { Bookshelf } from '../../sections/Bookshelf/Bookshelf';
import { FreeGuide } from '../../sections/FreeGuide/FreeGuide';
import { Hero } from '../../sections/Hero/Hero';
import { HowItWorks } from '../../sections/HowItWorks/HowItWorks';

export function HomePage() {
  return (
    <main id={SECTION_IDS.mainContent}>
      <Hero />
      <Bookshelf />
      <HowItWorks />
      <AboutBlank />
      <FreeGuide />
    </main>
  );
}
