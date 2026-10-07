import React, { useState, useEffect, useCallback } from 'react';
import { Info, X, ExternalLink } from 'lucide-react';
import changelogRaw from '../../CHANGELOG.md?raw';
import { sectionFor, parseInline } from '../utils/changelog';

const CHANGELOG_URL = 'https://github.com/aderamdani/CoreView/blob/main/CHANGELOG.md';

const InlineText = ({ text }) => (
  <>
    {parseInline(text).map((seg, i) =>
      seg.type === 'code' ? (
        <code key={i} className="about-code">
          {seg.value}
        </code>
      ) : (
        <React.Fragment key={i}>{seg.value}</React.Fragment>
      ),
    )}
  </>
);

export function AboutPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const version = __APP_VERSION__;
  const groups = sectionFor(changelogRaw, version);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  return (
    <>
      <button
        type="button"
        className="version-chip"
        onClick={() => setIsOpen(true)}
        title={`Lihat catatan rilis ${version}`}
        aria-haspopup="dialog"
      >
        <Info size={13} />
        {`v${version}`}
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={close} role="presentation">
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
          >
            <div className="modal-header">
              <h3 id="about-title">
                <Info size={18} />
                {`CoreView v${version}`}
              </h3>
              <button className="btn-close" onClick={close} title="Tutup">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {groups ? (
                groups.map((group) => (
                  <section key={group.title} className="about-group">
                    <h4 className="about-group-title">{group.title}</h4>
                    <ul className="about-list">
                      {group.items.map((item, i) => (
                        <li key={`${group.title}-${i}`}>
                          <InlineText text={item} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              ) : (
                <p className="about-empty">
                  {`Belum ada catatan rilis untuk versi ${version}. Riwayat lengkapnya ada di berkas CHANGELOG.md pada repositori.`}
                </p>
              )}

              <a className="about-link" href={CHANGELOG_URL} target="_blank" rel="noopener noreferrer">
                Riwayat versi selengkapnya
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
