import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Check, Flower2, Leaf, Palette, PenLine, Search, Sprout, X } from 'lucide-react';
import { emptyPlant, finishPlant, NAME_LIMIT, NOTE_LIMIT, paletteColors, palettes, plantCatalog, plantInfo, type GardenPlant, type PlantCategory, type PlantDraft, type PlantKind } from '../garden/plantings';
import { validatePlantText } from '../garden/moderation';
import { PlantIllustration } from './PlantIllustration';
import { PlantPreview } from './PlantPreview';
import { FlowerDesigner } from './FlowerDesigner';
import { copyFlowerDesign, defaultFlowerDesign } from '../garden/flowerDesign';
import './planting.css';
import { useGardenAccount } from '../account/AccountProvider';

type Props = { plant?: GardenPlant; onSave(plant: GardenPlant): Promise<void>; onRemove?(plant: GardenPlant): Promise<void>; onClose(): void };
export function PlantStudio({ plant, onSave, onRemove, onClose }: Props) {
  const account = useGardenAccount();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [draft, setDraft] = useState<PlantDraft>(() => ({ ...(plant ? { ...plant, colors: { ...plant.colors }, ...(plant.design ? { design: copyFlowerDesign(plant.design) } : {}) } : emptyPlant()), ...(account.user ? { author: account.user.name } : {}) }));
  const [identity] = useState(() => plant ?? finishPlant(emptyPlant()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const info = plantInfo(draft.kind);
  const [category, setCategory] = useState<PlantCategory>(info.category);
  const [query, setQuery] = useState('');
  const varieties = plantCatalog.filter(item => item.category === category).sort((a, b) => a.kind === 'custom-flower' ? -1 : b.kind === 'custom-flower' ? 1 : a.name.localeCompare(b.name));
  const searchTerm = query.trim().toLowerCase();
  const matchingVarieties = varieties.filter(item => `${item.name}${item.kind === 'custom-flower' ? ' design your own flower' : ''}`.toLowerCase().includes(searchTerm));

  async function submit(removing = false) {
    if (saving.current) return;
    if (!account.ready || account.busy) { setError('Please reconnect your garden account before saving.'); return; }
    if (!removing) {
      const moderation = validatePlantText(draft.author, draft.note);
      if (moderation.ok === false) {
        setError(moderation.message);
        document.getElementById(moderation.field === 'note' ? 'plant-note' : 'plant-author')?.focus();
        return;
      }
    }
    saving.current = true; setBusy(true); setError('');
    try { if (removing && plant) await onRemove?.(plant); else await onSave(finishPlant(draft, identity)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'That planting couldn’t be saved. Please try again.'); }
    finally { saving.current = false; setBusy(false); }
  }

  useLayoutEffect(() => {
    const element = dialog.current!;
    const origin = document.activeElement as HTMLElement | null;
    const x = scrollX, y = scrollY, body = document.body;
    const keys = ['position', 'top', 'left', 'width', 'overflow'] as const;
    const previous = keys.map(key => [key, body.style[key]] as const);
    body.style.position = 'fixed'; body.style.top = `${-y}px`; body.style.left = `${-x}px`; body.style.width = '100%'; body.style.overflow = 'hidden';
    element.showModal(); title.current?.focus({ preventScroll: true });
    return () => { element.close(); previous.forEach(([key, value]) => { body.style[key] = value; }); window.scrollTo({ left: x, top: y, behavior: 'instant' });
      if (origin?.isConnected) origin.focus({ preventScroll: true }); else document.querySelector<HTMLButtonElement>('.plant-button')?.focus({ preventScroll: true }); };
  }, []);

  function choose(kind: PlantKind) {
    setDraft(value => ({ ...value, kind, ...(kind === 'custom-flower' ? { design: value.design ?? defaultFlowerDesign() } : {}), colors: value.palette === 'custom' ? value.colors : paletteColors(kind, value.palette) }));
  }
  const categories: { id: PlantCategory; label: string }[] = [{ id: 'flowers', label: 'Flowers' }, { id: 'plants', label: 'Plants' }, { id: 'fruit', label: 'Fruit' }];
  const categoryLabel = categories.find(item => item.id === category)!.label.toLowerCase();
  return <dialog ref={dialog} className="plant-studio" aria-labelledby="plant-studio-title" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
    event.stopPropagation();
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input, textarea, [tabindex="0"]')].filter(control => control.getClientRects().length);
    const index = controls.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
    else if (!event.shiftKey && (index === controls.length - 1 || index < 0)) { event.preventDefault(); controls[0]?.focus(); }
  }}>
    <header className="studio-header"><span><Sprout size={18} strokeWidth={1.3} /> The garden <i>/</i> Planting studio</span><button type="button" className="studio-close" onClick={onClose} aria-label="Close planting studio"><X size={19} strokeWidth={1.4} /></button></header>
    <div className="studio-body">
      <section className="studio-specimen" aria-label="Your planting preview">
        <p className="studio-eyebrow">Add to the garden</p>
        <h2 id="plant-studio-title" ref={title} tabIndex={-1}>{plant ? 'Edit your' : 'Pick a'}<br /><em>{plant ? 'planting.' : 'plant.'}</em></h2>
        <PlantPreview kind={draft.kind} colors={draft.colors} design={draft.design} />
        <div className="specimen-caption"><span>{info.name}</span><i>{info.detail}</i></div>
        <div className={`studio-note-preview${draft.note ? '' : ' is-placeholder'}`}>
          <span className="note-pin" />
          <p>{draft.note || 'Your note will appear here.'}</p>
          <span className="note-signature">{draft.author.trim() ? `from ${draft.author.trim()}` : 'your name goes here'}</span>
        </div>
      </section>
      <form className="studio-form" aria-busy={busy} onSubmit={event => { event.preventDefault(); void submit(); }}>
        <fieldset className="studio-fieldset" disabled={busy}>
          <legend><span>01</span> Choose what grows <small>{plantCatalog.length} varieties</small></legend>
          <div className="plant-categories" role="group" aria-label="Plant category">{categories.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setQuery(''); }}>{item.label}<span>{plantCatalog.filter(plant => plant.category === item.id).length}</span></button>)}</div>
          <div className="plant-search"><Search size={14} aria-hidden="true" /><label className="plant-sr-only" htmlFor="plant-search">Search {categoryLabel}</label><input id="plant-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${categoryLabel}…`} autoComplete="off" aria-controls="plant-varieties" />{query && <button type="button" aria-label="Clear plant search" onClick={() => { setQuery(''); document.getElementById('plant-search')?.focus(); }}><X size={14} /></button>}</div>
          <div key={category} id="plant-varieties" className={`plant-options${draft.kind === 'custom-flower' && category === 'flowers' ? ' is-designing' : ''}`} role="group" aria-label="Plant variety" aria-describedby="plant-variety-caption">{matchingVarieties.map(item => <button type="button" key={item.kind} className={`plant-option${item.kind === 'custom-flower' ? ' is-designer' : ''}`} aria-label={item.kind === 'custom-flower' ? 'Design your own flower' : undefined} aria-pressed={draft.kind === item.kind} onClick={() => choose(item.kind)}><PlantIllustration kind={item.kind} colors={item.colors} design={item.kind === 'custom-flower' ? draft.design : undefined} /><span>{item.kind === 'custom-flower' ? 'Design your own' : item.name}</span>{item.kind === 'custom-flower' && <PenLine className="plant-option-design-icon" size={12} aria-hidden="true" />}{draft.kind === item.kind && <Check className="plant-option-check" size={12} />}</button>)}{matchingVarieties.length === 0 && <p className="plant-search-empty">No {categoryLabel} found. Try another name.</p>}</div>
          <p id="plant-variety-caption" className="plant-variety-caption" role="status">{query.trim() ? `${matchingVarieties.length} of ${varieties.length} varieties shown.` : `${varieties.length} varieties. Scroll to find your favourite.`}</p>
          {draft.kind === 'custom-flower' && category === 'flowers' && <FlowerDesigner design={draft.design!} onChange={design => setDraft(value => ({ ...value, design }))} />}
        </fieldset>
        <fieldset className="studio-fieldset" disabled={busy}>
          <legend><span>02</span> Make it your colour</legend>
          <div className="plant-palette-row" role="group" aria-label="Plant colour palette">
            <button type="button" className="natural-palette" aria-pressed={draft.palette === 'natural'} onClick={() => setDraft(value => ({ ...value, palette: 'natural', colors: paletteColors(value.kind, 'natural') }))}><Leaf size={14} />Natural</button>
            {palettes.map(palette => <button type="button" key={palette.id} className="plant-swatch" aria-label={palette.name} title={palette.name} aria-pressed={draft.palette === palette.id} style={{ '--swatch': palette.colors.main, '--swatch-leaf': palette.colors.leaves } as CSSProperties} onClick={() => setDraft(value => ({ ...value, palette: palette.id, colors: { ...palette.colors } }))}><span />{draft.palette === palette.id && <Check size={13} />}</button>)}
            <button type="button" className="plant-mix" aria-label="Mix your own colours" aria-pressed={draft.palette === 'custom'} onClick={() => setDraft(value => ({ ...value, palette: 'custom' }))}><Palette size={18} strokeWidth={1.3} /></button>
          </div>
          {draft.palette === 'custom' ? <div className="custom-colours"><label><input type="color" value={draft.colors.main} onChange={event => setDraft(value => ({ ...value, colors: { ...value.colors, main: event.target.value } }))} />{draft.kind === 'custom-flower' ? 'Petal colour' : 'Main colour'}</label><label><input type="color" value={draft.colors.leaves} onChange={event => setDraft(value => ({ ...value, colors: { ...value.colors, leaves: event.target.value } }))} />{draft.kind === 'custom-flower' ? 'Stem & leaves' : 'Leaf colour'}</label></div> : <p className="palette-caption">{draft.palette === 'natural' ? 'The original colours for this plant.' : `${palettes.find(item => item.id === draft.palette)?.name} colours.`}<button type="button" onClick={() => setDraft(value => ({ ...value, palette: 'custom' }))}>Mix your own</button></p>}
        </fieldset>
        <fieldset className="studio-fieldset studio-message" disabled={busy}>
          <legend><span>03</span> Add a note <small>optional</small></legend>
          <div className="note-input-wrap"><label className="plant-sr-only" htmlFor="plant-note">Your handwritten note</label><textarea id="plant-note" value={draft.note} onChange={event => setDraft(value => ({ ...value, note: event.target.value }))} maxLength={NOTE_LIMIT} placeholder="Say hey or leave a message…" rows={3} /><span className="note-count" aria-hidden="true">{draft.note.length} / {NOTE_LIMIT}</span></div>
          <label className="plant-author" htmlFor="plant-author"><span>From <small>*</small></span><input id="plant-author" readOnly={!!account.user} value={draft.author} onChange={event => setDraft(value => ({ ...value, author: event.target.value }))} maxLength={NAME_LIMIT} placeholder="Your name or nickname" autoComplete="nickname" required pattern=".*\S.*" /></label>
          {account.user && <p className="studio-account-caption"><Check size={12} />Linked to your garden account</p>}<p className="studio-sharing">Everyone can see your name and note. You can add one plant every seven days and edit it whenever you like.</p>
        </fieldset>
        <div className="studio-submit">{error && <p className="studio-error" role="alert">{error}</p>}<button type="submit" className="studio-plant-action" disabled={busy}><Flower2 size={17} strokeWidth={1.3} />{busy ? 'Saving your planting…' : plant?.shared ? 'Save my planting' : plant ? 'Share my planting' : 'Plant in the garden'}<ArrowRight size={17} strokeWidth={1.4} /></button><p>{account.user ? 'Saved to your account. You can edit it from any device.' : 'Planted under your nickname. Sign in to keep it with your account.'}</p>{plant && <button type="button" className="studio-remove" disabled={busy} onClick={() => { void submit(true); }}>Remove this planting</button>}</div>
      </form>
    </div>
  </dialog>;
}
