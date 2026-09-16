import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { KundenprojektePage, ProjectReviews } from './KundenprojektePage';
import { routeFor } from '@/lib/routing/publicRoutes';

afterEach(cleanup);

describe('project portrait publication boundaries', () => {
  it('keeps the unfinished project out of the sitemap', () => {
    expect(routeFor('/kundenprojekte')?.indexable).toBe(false);
    expect(routeFor('/kundenprojekte')?.sitemap).toBeUndefined();
  });
  it('identifies the concept as unfinished and preserves the confirmed expansion address', () => {
    render(<MemoryRouter><KundenprojektePage /></MemoryRouter>);
    expect(screen.getByText(/Projektvorschau/)).toBeTruthy();
    expect(screen.getByText(/Schematische Darstellung/)).toBeTruthy();
    expect(screen.getByText(/Opernstraße 3/)).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByText('Kundenstimmen.')).toBeNull();
  });
  it('never renders an unapproved customer quote', () => {
    const { container } = render(<ProjectReviews entries={[{ quote: 'Private draft', author: 'Author', role: 'Owner', company: 'Company', approvedAt: '2026-09-16', publicationApproved: false }]} />);
    expect(container.textContent).toBe('');
  });
  it('requires an approval date even when permission is flagged', () => {
    const { container } = render(<ProjectReviews entries={[{ quote: 'Private draft', author: 'Author', role: 'Owner', company: 'Company', approvedAt: '', publicationApproved: true }]} />);
    expect(container.textContent).toBe('');
  });
});
