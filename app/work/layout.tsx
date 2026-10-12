import WorkHeader from '@/components/WorkHeader';

// Everything under /work gets the backend's own header and nothing else.
//
// The site's nav and footer hide themselves on these paths rather than being
// lifted out into a route group. A route group — moving every public page into
// app/(site)/ — is the tidier Next answer and it would mean moving every page
// in the repository to change the chrome on nine of them. The guard is two
// lines in each component and says why it is there.
export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WorkHeader />
      {children}
    </>
  );
}
