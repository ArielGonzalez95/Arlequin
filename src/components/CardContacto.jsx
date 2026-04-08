import { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import contactConfig from '../config/contact.json';
import './CardQueEsArlequin.css';
import './CardContacto.css';

// ── Frame builders ────────────────────────────────────────────────────────────
const BASE = '/Cartas/Contacto/';

function getOpenFrames(theme) {
  // 00000-00006 dorso, 00007-00012 contacto  (13 frames, fixed at last)
  return [
    ...Array.from({ length: 7 }, (_, i) =>
      `${BASE}${String(i).padStart(5, '0')}arlequin_dorso_${theme}.avif`),
    ...Array.from({ length: 6 }, (_, i) =>
      `${BASE}${String(i + 7).padStart(5, '0')}arlequin_contacto_${theme}.avif`),
  ];
}

function getPostSendFrames(theme) {
  // 00013-00018 contacto, 00019-00023 gracias, 00024 dorso  (12 frames, fixed at last)
  const graSuffix = theme === 'dark' ? 'dorso_dark_gracias' : 'dorso_clear';
  return [
    ...Array.from({ length: 6 }, (_, i) =>
      `${BASE}${String(i + 13).padStart(5, '0')}arlequin_contacto_${theme}.avif`),
    ...Array.from({ length: 5 }, (_, i) =>
      `${BASE}${String(i + 19).padStart(5, '0')}arlequin_${graSuffix}.avif`),
    `${BASE}00024arlequin_dorso_${theme}.avif`,
  ];
}

function getCloseFrames(theme) {
  // 00025-00030 frente, 00031-00035 contacto_dark / dorso_clear, 00000 dorso  (12 frames)
  const lastSuffix = theme === 'dark' ? 'contacto_dark' : 'dorso_clear';
  return [
    ...Array.from({ length: 6 }, (_, i) =>
      `${BASE}${String(i + 25).padStart(5, '0')}arlequin_frente_${theme}.avif`),
    ...Array.from({ length: 5 }, (_, i) =>
      `${BASE}${String(i + 31).padStart(5, '0')}arlequin_${lastSuffix}.avif`),
    `${BASE}00000arlequin_dorso_${theme}.avif`,
  ];
}

// ── Button animation constants ────────────────────────────────────────────────
const BTN_LOOP_END       = 71;
const BTN_SEND_START     = 72;
const BTN_SEND_END       = 168;
const BTN_FRAME_DURATION = 40;
const BTN_DISPLAY_WIDTH  = 500;
const CARD_FRAME_DURATION = 40;
const CARD_WIDTH  = 550;
const CARD_HEIGHT = 680;

// ── Image caches (persist across theme toggles) ───────────────────────────────
const _openCache     = {};
const _postSendCache = {};
const _closeCache    = {};
const _btnCache      = {};

// ── Component ─────────────────────────────────────────────────────────────────
function CardContacto({ isDarkMode, onClose, onCloseStart, fromGrid = false, preload = false }) {
  const canvasRef         = useRef(null);
  const openImagesRef     = useRef([]);
  const postSendImagesRef = useRef([]);
  const closeImagesRef    = useRef([]);
  const animRAFRef        = useRef(null);
  const frameIdxRef       = useRef(0);
  const lastTimeRef       = useRef(0);

  // Button refs
  const btnCanvasRef     = useRef(null);
  const btnLoopFramesRef = useRef([]);
  const btnSendFramesRef = useRef([]);
  const btnAnimRef       = useRef(null);
  const btnFrameRef      = useRef(0);
  const btnPhaseRef      = useRef('loop');
  const btnLastTimeRef   = useRef(0);

  const winClickRef = useRef(null);
  const winMoveRef  = useRef(null);
  const moveRafRef  = useRef(null);

  // 'loading' | 'opening' | 'fixedForm' | 'postSend' | 'fixedGracias' | 'closing'
  const [animPhase,    setAnimPhase]    = useState('loading');
  const [isLoaded,     setIsLoaded]     = useState(false);
  const [showContent,  setShowContent]  = useState(false);
  const [showGracias,  setShowGracias]  = useState(false);
  const [isScalingDown,setIsScalingDown]= useState(false);
  const [isHidingUI,   setIsHidingUI]   = useState(false);
  const [isBtnLoaded,  setIsBtnLoaded]  = useState(false);
  const [btnPhaseDone, setBtnPhaseDone] = useState(false);

  // Form state
  const [nombre,      setNombre]      = useState('');
  const [mail,        setMail]        = useState('');
  const [telefono,    setTelefono]    = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando,    setEnviando]    = useState(false);
  const [enviado,     setEnviado]     = useState(false);
  const [errorEnvio,  setErrorEnvio]  = useState(false);

  const theme = isDarkMode ? 'dark' : 'clear';

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (animPhase === 'closing' || isHidingUI) return;
    setIsHidingUI(true);
    setShowContent(false);
    setShowGracias(false);
    if (onCloseStart) onCloseStart();
    setTimeout(() => {
      setAnimPhase('closing');
    }, 350);
  };

  const handleEnviar = async () => {
    if (enviando || enviado) return;
    setEnviando(true);
    setErrorEnvio(false);
    const { serviceId, templateId, publicKey } = contactConfig.emailjs;
    try {
      await emailjs.send(serviceId, templateId, {
        to_email:   contactConfig.destinatario,
        from_name:  nombre,
        from_email: mail,
        telefono,
        descripcion,
      }, publicKey);
      setEnviado(true);
      setNombre(''); setMail(''); setTelefono(''); setDescripcion('');
    } catch (err) {
      console.error('Error al enviar:', err);
      setErrorEnvio(true);
    } finally {
      setEnviando(false);
    }
  };

  const mailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());
  const telValido  = /^\+?[\d\s\-().]{8,20}$/.test(telefono.trim()) &&
    telefono.replace(/\D/g, '').length >= 8;
  const formValido = nombre.trim() !== '' && mailValido && telValido && descripcion.trim() !== '';

  const handleBtnClick = () => {
    if (btnPhaseRef.current !== 'loop' || enviando || enviado || !formValido) return;
    btnPhaseRef.current    = 'send';
    btnFrameRef.current    = 0;
    btnLastTimeRef.current = 0;
    handleEnviar();
  };

  winClickRef.current = (e) => {
    if (!showContent || btnPhaseDone || !isBtnLoaded || !formValido || enviando || enviado) return;
    const canvas = btnCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const scale = canvas.width / rect.width;
    const px = Math.round(x * scale);
    const py = Math.round(y * scale);
    if (canvas.getContext('2d').getImageData(px, py, 1, 1).data[3] < 10) return;
    handleBtnClick();
  };

  winMoveRef.current = (e) => {
    if (moveRafRef.current) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = null;
      const canvas = btnCanvasRef.current;
      if (!canvas || !showContent || btnPhaseDone || !isBtnLoaded) {
        document.body.style.cursor = '';
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let isOver = false;
      if (formValido && !enviando && !enviado && x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        const scale = canvas.width / rect.width;
        isOver = canvas.getContext('2d').getImageData(
          Math.round(x * scale), Math.round(y * scale), 1, 1
        ).data[3] > 10;
      }
      document.body.style.cursor = isOver ? 'pointer' : '';
    });
  };

  // ── Preload all card frames ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const loadList = (list) => Promise.all(list.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
        img.onerror = () => resolve(null);
        img.src = src;
      })));

      const openList     = getOpenFrames(theme);
      const postSendList = getPostSendFrames(theme);
      const closeList    = getCloseFrames(theme);

      const [openRes, postRes, closeRes] = await Promise.all([
        _openCache[theme]     ? Promise.resolve(_openCache[theme])     : loadList(openList),
        _postSendCache[theme] ? Promise.resolve(_postSendCache[theme]) : loadList(postSendList),
        _closeCache[theme]    ? Promise.resolve(_closeCache[theme])    : loadList(closeList),
      ]);

      _openCache[theme]     = openRes;
      _postSendCache[theme] = postRes;
      _closeCache[theme]    = closeRes;

      openImagesRef.current     = openRes;
      postSendImagesRef.current = postRes;
      closeImagesRef.current    = closeRes;

      if (!preload) setIsLoaded(true);
    };
    load();
  }, [theme, preload]);

  // ── Start opening animation once loaded ─────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    const delay = fromGrid ? 0 : 600;
    const t = setTimeout(() => setAnimPhase('opening'), delay);
    return () => clearTimeout(t);
  }, [isLoaded, fromGrid]);

  // ── Canvas setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for 60Hz mobile perf
    canvas.width  = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width  = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);
    const first = openImagesRef.current[0];
    if (first) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(first, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
  }, [isLoaded]);

  // ── Main animation loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (animPhase === 'loading' || animPhase === 'fixedForm' || animPhase === 'fixedGracias') return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    let frames;
    if (animPhase === 'opening')  frames = openImagesRef.current;
    if (animPhase === 'postSend') frames = postSendImagesRef.current;
    if (animPhase === 'closing')  frames = closeImagesRef.current;

    frameIdxRef.current = 0;
    lastTimeRef.current = 0;
    canvas.style.transition = '';
    canvas.style.transform = '';

    // Draw first frame immediately
    if (frames[0]) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(frames[0], 0, 0, CARD_WIDTH, CARD_HEIGHT); }

    const animate = (timestamp) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp - CARD_FRAME_DURATION;
      }
      if (timestamp - lastTimeRef.current >= CARD_FRAME_DURATION) {
        lastTimeRef.current += CARD_FRAME_DURATION;
        const idx = frameIdxRef.current;
        const img = frames[idx];
        if (img) {
          ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
          ctx.drawImage(img, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }

        if (idx < frames.length - 1) {
          frameIdxRef.current++;
          animRAFRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          if (animPhase === 'opening')  { setAnimPhase('fixedForm');    setShowContent(true); }
          if (animPhase === 'postSend') { setAnimPhase('fixedGracias'); setShowGracias(true); }
          if (animPhase === 'closing')  {
            // Smooth shrink to grid card size, then hand off
            const _tw = window.innerWidth <= 500 ? window.innerWidth * 0.85 : 390;
            if (fromGrid) {
              const _th = _tw * 4 / 3;
              const rendered = canvasRef.current.getBoundingClientRect();
              const _sx = (_tw / rendered.width).toFixed(4);
              const _sy = (_th / rendered.height).toFixed(4);
              canvas.style.transition = 'transform 0.55s ease-in-out';
              canvas.style.transform = `scaleX(${_sx}) scaleY(${_sy})`;
              setTimeout(() => onClose(), 650);
            } else {
              setIsScalingDown(true);
              setTimeout(() => onClose(), 400);
            }
          }
        }
      } else {
        animRAFRef.current = requestAnimationFrame(animate);
      }
    };

    animRAFRef.current = requestAnimationFrame(animate);
    return () => { if (animRAFRef.current) cancelAnimationFrame(animRAFRef.current); };
  }, [animPhase]);

  // ── Trigger postSend when button animation completes ─────────────────────────
  useEffect(() => {
    if (!btnPhaseDone) return;
    setShowContent(false);
    setAnimPhase('postSend');
  }, [btnPhaseDone]);

  // ── Console helper to test post-send animation ───────────────────────────────
  useEffect(() => {
    window.__testEnvio = () => {
      if (animPhase !== 'fixedForm') {
        console.warn('__testEnvio: debe estar en la carta fija (fixedForm)');
        return;
      }
      setShowContent(false);
      setAnimPhase('postSend');
    };
    return () => { delete window.__testEnvio; };
  }, [animPhase]);

  // ── Preload button frames ────────────────────────────────────────────────────
  useEffect(() => {
    if (preload) return; // skip heavy button preload — loads on actual open
    const t = theme;
    let cancelled = false;
    setIsBtnLoaded(false);
    setBtnPhaseDone(false);
    btnPhaseRef.current = 'loop';
    btnFrameRef.current = 0;

    if (_btnCache[t]) {
      btnLoopFramesRef.current = _btnCache[t].loop;
      btnSendFramesRef.current = _btnCache[t].send;
      setIsBtnLoaded(true);
      return () => { cancelled = true; };
    }

    const folder = `/NEW_animacion_boton_enviar_${t}/NEW_animacion_boton_enviar_${t}/`;
    const loopPromises = Array.from({ length: BTN_LOOP_END + 1 }, (_, i) =>
      new Promise(resolve => {
        const img = new Image();
        img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
        img.onerror = () => resolve(null);
        img.src = `${folder}animacion_boton_enviar_${String(i).padStart(5, '0')}_loop.avif`;
      })
    );
    const sendPromises = Array.from({ length: BTN_SEND_END - BTN_SEND_START + 1 }, (_, i) => {
      const n = BTN_SEND_START + i;
      return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
        img.onerror = () => resolve(null);
        img.src = `${folder}animacion_boton_enviar_${t}_${String(n).padStart(5, '0')}.avif`;
      });
    });

    Promise.all([Promise.all(loopPromises), Promise.all(sendPromises)]).then(([loop, send]) => {
      if (cancelled) return;
      _btnCache[t] = { loop, send };
      btnLoopFramesRef.current = loop;
      btnSendFramesRef.current = send;
      setIsBtnLoaded(true);
    });

    return () => { cancelled = true; };
  }, [theme]);

  // ── Button animation RAF ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!showContent || !isBtnLoaded) return;
    const canvas = btnCanvasRef.current;
    if (!canvas) return;
    const firstFrame = btnLoopFramesRef.current[0];
    if (!firstFrame) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = firstFrame.naturalWidth;
    const h = firstFrame.naturalHeight;
    const displayH = Math.round(h * BTN_DISPLAY_WIDTH / w);
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = `${BTN_DISPLAY_WIDTH}px`;
    canvas.style.height = `${displayH}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    btnPhaseRef.current = 'loop';
    btnFrameRef.current = 0;
    setBtnPhaseDone(false);

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(firstFrame, 0, 0, w, h);

    const animate = (timestamp) => {
      if (btnLastTimeRef.current === 0) btnLastTimeRef.current = timestamp;
      if (timestamp - btnLastTimeRef.current >= BTN_FRAME_DURATION) {
        btnLastTimeRef.current += BTN_FRAME_DURATION;
        const phase = btnPhaseRef.current;
        let frame;
        if (phase === 'loop') {
          frame = btnLoopFramesRef.current[btnFrameRef.current];
          btnFrameRef.current = (btnFrameRef.current + 1) % (BTN_LOOP_END + 1);
        } else if (phase === 'send') {
          frame = btnSendFramesRef.current[btnFrameRef.current];
          const isLast = btnFrameRef.current >= btnSendFramesRef.current.length - 1;
          if (!isLast) {
            btnFrameRef.current++;
          } else {
            if (frame) { ctx.clearRect(0, 0, w, h); ctx.drawImage(frame, 0, 0, w, h); }
            setBtnPhaseDone(true);
            return;
          }
        }
        if (frame) { ctx.clearRect(0, 0, w, h); ctx.drawImage(frame, 0, 0, w, h); }
      }
      btnAnimRef.current = requestAnimationFrame(animate);
    };

    btnLastTimeRef.current = 0;
    btnAnimRef.current = requestAnimationFrame(animate);
    return () => { if (btnAnimRef.current) cancelAnimationFrame(btnAnimRef.current); };
  }, [showContent, isBtnLoaded]);

  // ── Window click + mousemove para botón ──────────────────────────────────────
  useEffect(() => {
    if (!showContent || !isBtnLoaded) return;
    const onClick     = (e) => winClickRef.current?.(e);
    const onMouseMove = (e) => winMoveRef.current?.(e);
    window.addEventListener('click',     onClick);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('click',     onClick);
      window.removeEventListener('mousemove', onMouseMove);
      document.body.style.cursor = '';
      if (moveRafRef.current) cancelAnimationFrame(moveRafRef.current);
    };
  }, [showContent, isBtnLoaded]);

  // ── Render ───────────────────────────────────────────────────────────────────
  if (preload) return null;
  if (!isLoaded) return <div className="card-que-es-arlequin loading" />;

  return (
    <div className="card-que-es-arlequin card-contacto-outer">
      <button className={`card-close-btn${isHidingUI ? ' card-close-btn--hiding' : ''}`} onClick={handleClose} title="Cerrar">
        <img
          src={`/Cartas/arlequin_elemento_web_X_${isDarkMode ? 'dark' : 'clare'}.avif`}
          alt="Cerrar"
          className="card-close-btn-img"
        />
      </button>

      <canvas
        ref={canvasRef}
        className={`card-canvas${isScalingDown ? ' card-canvas--exiting' : ''}`}
        style={!isScalingDown && fromGrid ? { animation: 'none' } : undefined}
      />

      {showGracias && (
        <div className="contacto-fija-text" style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
          <span>Gracias por tu Msj ⭐</span>
          <span>Nos comunicaremos</span>
          <span>a la Brevedad 🎭</span>
        </div>
      )}

      {showContent && (
        <>
          <div className="contacto-form">
            <div className="contacto-field-group">
              <input
                type="text"
                className="contacto-field"
                placeholder="Nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                disabled={enviado}
              />
            </div>
            <div
              className="contacto-field-group"
              data-error={mail.trim() && !mailValido ? 'Mail inválido' : undefined}
            >
              <input
                type="email"
                className={`contacto-field${mail.trim() && !mailValido ? ' contacto-field--invalid' : ''}`}
                placeholder="@"
                value={mail}
                onChange={e => setMail(e.target.value)}
                disabled={enviado}
              />
            </div>
            <div
              className="contacto-field-group"
              data-error={telefono.trim() && !telValido ? 'Teléfono inválido' : undefined}
            >
              <input
                type="tel"
                className={`contacto-field${telefono.trim() && !telValido ? ' contacto-field--invalid' : ''}`}
                placeholder="Tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                disabled={enviado}
              />
            </div>
            <div className="contacto-field-group">
              <textarea
                className="contacto-field"
                placeholder="Servicio de interés"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                maxLength={500}
                rows={2}
                disabled={enviado}
              />
            </div>
          </div>

          <div className="contacto-send-area">
            {errorEnvio && <span className="contacto-status contacto-status--error">Error al enviar</span>}
            {!btnPhaseDone && isBtnLoaded && (
              <canvas
                ref={btnCanvasRef}
                className="contacto-send-canvas"
                style={{
                  opacity: formValido || enviado ? 1 : 0.4,
                  pointerEvents: formValido && !enviando && !enviado ? 'auto' : 'none',
                  cursor: formValido && !enviando && !enviado ? 'pointer' : 'default',
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CardContacto;
