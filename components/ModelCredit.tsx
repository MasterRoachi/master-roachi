import type { GarmentModel } from '@/lib/models';

/**
 * Attribution for a 3D garment.
 *
 * Required by the licence rather than optional politeness, and rendered only
 * where the model it names is actually on the page — crediting borrowed work
 * on a page that does not use it is its own kind of wrong. The full licence
 * text ships beside each model in public/store/.
 */
export default function ModelCredit({
  model,
  className,
}: {
  model: GarmentModel;
  className?: string;
}) {
  const { title, modelUrl, author, authorUrl, license, licenseUrl } =
    model.credit;

  return (
    <p className={className}>
      Model{' '}
      <a href={modelUrl} target="_blank" rel="noopener noreferrer">
        {title}
      </a>{' '}
      by{' '}
      <a href={authorUrl} target="_blank" rel="noopener noreferrer">
        {author}
      </a>
      , licensed{' '}
      <a href={licenseUrl} target="_blank" rel="noopener noreferrer">
        {license}
      </a>
      .
    </p>
  );
}
