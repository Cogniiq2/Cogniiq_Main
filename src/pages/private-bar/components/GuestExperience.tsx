import { useEffect, useRef, useState } from 'react';

import { strings } from '../../../private-bar/strings';

/**
 * The BoLaGio Guest Experience preview.
 *
 * Framed as an early look at a service being prepared, never as an apology for
 * something unfinished. Each row states plainly whether it is available now or
 * shortly, so nothing here reads as a promise that has already been made.
 *
 * The reveal is opt-in: the section renders fully visible, and only once the
 * component has mounted does it arm the entrance animation. Without JavaScript,
 * or without IntersectionObserver, the content is simply there — a reveal that
 * can hide content permanently is not a reveal, it is a bug.
 */
export function GuestExperience() {
  const ref = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const className = ['pb-guest', armed ? 'pb-reveal' : '', visible ? 'is-visible' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section ref={ref} className={className} aria-labelledby="pb-guest-heading">
      <p className="pb-eyebrow">{strings.guestExperience.eyebrow}</p>
      <h2 id="pb-guest-heading" className="pb-display pb-guest__heading">
        {strings.guestExperience.heading}
      </h2>
      <p className="pb-body pb-guest__body">{strings.guestExperience.body}</p>

      <ul className="pb-services">
        {strings.guestExperience.items.map((item) => (
          <li key={item.title} className="pb-service">
            <div className="pb-service__head">
              <h3 className="pb-service__title">{item.title}</h3>
              <span className={item.available ? 'pb-service__status is-live' : 'pb-service__status'}>
                {item.status}
              </span>
            </div>
            <p className="pb-service__body">{item.description}</p>
          </li>
        ))}
      </ul>

      <p className="pb-guest__footnote">{strings.guestExperience.footnote}</p>
    </section>
  );
}
