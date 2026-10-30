// NUEVO (08): ilustración animada de cada deporte ("mundo"): la cancha dibujada con SVG
// y la pelota en movimiento con Animated (transformaciones nativas, fluidas en gama baja).
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Polygon, Line, Ellipse, Path, Circle } from 'react-native-svg';

// Paleta de cada mundo
export const MUNDOS = {
  DEPORTE_FRONTON: {
    fondo: ['#0B1622', '#16283A'],
    acento: '#ABEE38',
    piso: '#12324A',
    linea: '#ABEE38',
    pelota: '#F4F7F2',
    lema: 'elegirDeporte.lemas.fronton',
  },
  DEPORTE_TENIS: {
    fondo: ['#0F2418', '#1C3E2A'],
    acento: '#E4F53B',
    piso: '#C8642E',
    linea: '#FFFFFF',
    pelota: '#E4F53B',
    lema: 'elegirDeporte.lemas.tenis',
  },
  DEPORTE_PADEL: {
    fondo: ['#0A1630', '#17305E'],
    acento: '#7CC4FF',
    piso: '#1F57B8',
    linea: '#FFFFFF',
    pelota: '#E4F53B',
    lema: 'elegirDeporte.lemas.padel',
  },
};
export const MUNDO_DEFECTO = MUNDOS.DEPORTE_FRONTON;

// ── Cancha de cada deporte (estática) ─────────────────────────────────────
function Cancha({ codigo, w, h, m }) {
  const piso = [
    `${w * 0.22},${h * 0.42}`, `${w * 0.78},${h * 0.42}`,
    `${w * 0.98},${h * 0.96}`, `${w * 0.02},${h * 0.96}`,
  ].join(' ');

  if (codigo === 'DEPORTE_TENIS') {
    return (
      <>
        <Polygon points={piso} fill={m.piso} />
        {/* líneas de la cancha */}
        <Polygon points={`${w * 0.26},${h * 0.44} ${w * 0.74},${h * 0.44} ${w * 0.92},${h * 0.94} ${w * 0.08},${h * 0.94}`}
                 fill="none" stroke={m.linea} strokeWidth={2.5} />
        <Line x1={w * 0.5} y1={h * 0.44} x2={w * 0.5} y2={h * 0.94} stroke={m.linea} strokeWidth={2} />
        <Line x1={w * 0.2} y1={h * 0.6} x2={w * 0.8} y2={h * 0.6} stroke={m.linea} strokeWidth={2} />
        {/* red */}
        <Rect x={w * 0.14} y={h * 0.62} width={w * 0.72} height={h * 0.07} fill="rgba(255,255,255,0.08)" />
        <Line x1={w * 0.14} y1={h * 0.62} x2={w * 0.86} y2={h * 0.62} stroke="#FFFFFF" strokeWidth={3} />
        {Array.from({ length: 18 }).map((_, i) => (
          <Line key={i} x1={w * (0.14 + i * 0.04)} y1={h * 0.62} x2={w * (0.14 + i * 0.04)} y2={h * 0.69}
                stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
        ))}
        <Line x1={w * 0.13} y1={h * 0.6} x2={w * 0.13} y2={h * 0.7} stroke="#DDDDDD" strokeWidth={4} />
        <Line x1={w * 0.87} y1={h * 0.6} x2={w * 0.87} y2={h * 0.7} stroke="#DDDDDD" strokeWidth={4} />
      </>
    );
  }

  if (codigo === 'DEPORTE_PADEL') {
    return (
      <>
        <Polygon points={piso} fill={m.piso} />
        {/* paredes de vidrio */}
        <Rect x={w * 0.22} y={h * 0.2} width={w * 0.56} height={h * 0.22} fill="rgba(173,216,255,0.16)"
              stroke="rgba(173,216,255,0.6)" strokeWidth={2} />
        <Polygon points={`${w * 0.22},${h * 0.2} ${w * 0.22},${h * 0.42} ${w * 0.02},${h * 0.96} ${w * 0.02},${h * 0.56}`}
                 fill="rgba(173,216,255,0.1)" stroke="rgba(173,216,255,0.5)" strokeWidth={2} />
        <Polygon points={`${w * 0.78},${h * 0.2} ${w * 0.78},${h * 0.42} ${w * 0.98},${h * 0.96} ${w * 0.98},${h * 0.56}`}
                 fill="rgba(173,216,255,0.1)" stroke="rgba(173,216,255,0.5)" strokeWidth={2} />
        {/* reflejos del vidrio */}
        <Line x1={w * 0.3} y1={h * 0.22} x2={w * 0.36} y2={h * 0.4} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <Line x1={w * 0.62} y1={h * 0.22} x2={w * 0.66} y2={h * 0.34} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
        {/* líneas y red */}
        <Line x1={w * 0.15} y1={h * 0.62} x2={w * 0.85} y2={h * 0.62} stroke="#FFFFFF" strokeWidth={3} />
        <Line x1={w * 0.5} y1={h * 0.42} x2={w * 0.5} y2={h * 0.96} stroke={m.linea} strokeWidth={2} />
        <Line x1={w * 0.18} y1={h * 0.52} x2={w * 0.82} y2={h * 0.52} stroke={m.linea} strokeWidth={2} />
        <Line x1={w * 0.09} y1={h * 0.8} x2={w * 0.91} y2={h * 0.8} stroke={m.linea} strokeWidth={2} />
      </>
    );
  }

  // Frontón: la gran pared (frontis) y la cancha
  return (
    <>
      {/* frontis */}
      <Rect x={w * 0.16} y={h * 0.08} width={w * 0.68} height={h * 0.34} fill="url(#pared)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Line key={`h${i}`} x1={w * 0.16} y1={h * (0.13 + i * 0.05)} x2={w * 0.84} y2={h * (0.13 + i * 0.05)}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <Line x1={w * 0.16} y1={h * 0.33} x2={w * 0.84} y2={h * 0.33} stroke={m.linea} strokeWidth={3} />
      <Line x1={w * 0.16} y1={h * 0.12} x2={w * 0.84} y2={h * 0.12} stroke={m.linea} strokeWidth={2} opacity={0.6} />
      {/* pared lateral */}
      <Polygon points={`${w * 0.16},${h * 0.08} ${w * 0.16},${h * 0.42} ${w * 0.02},${h * 0.96} ${w * 0.02},${h * 0.3}`}
               fill="rgba(255,255,255,0.05)" />
      {/* piso */}
      <Polygon points={piso} fill={m.piso} />
      <Line x1={w * 0.12} y1={h * 0.66} x2={w * 0.88} y2={h * 0.66} stroke={m.linea} strokeWidth={2.5} />
      <Line x1={w * 0.07} y1={h * 0.82} x2={w * 0.93} y2={h * 0.82} stroke={m.linea} strokeWidth={2} opacity={0.7} />
      <Path d={`M ${w * 0.5} ${h * 0.66} L ${w * 0.5} ${h * 0.96}`} stroke={m.linea} strokeWidth={2} opacity={0.5} />
    </>
  );
}

// Recorrido de la pelota para cada deporte: puntos (x, y) en proporción y escala (profundidad)
const RECORRIDOS = {
  DEPORTE_FRONTON: { x: [0.78, 0.55, 0.42, 0.3, 0.22], y: [0.88, 0.5, 0.22, 0.52, 0.86], s: [1, 0.7, 0.45, 0.7, 1] },
  DEPORTE_TENIS:   { x: [0.3, 0.45, 0.6, 0.66, 0.7],   y: [0.9, 0.48, 0.38, 0.44, 0.5],  s: [1, 0.72, 0.52, 0.5, 0.48] },
  DEPORTE_PADEL:   { x: [0.72, 0.6, 0.48, 0.36, 0.28], y: [0.88, 0.46, 0.28, 0.5, 0.84], s: [1, 0.68, 0.48, 0.7, 1] },
};

/**
 * Escena animada de un deporte.
 * props: codigo, width, height, activo (la animación corre solo en el mundo visible), apagado (próximamente)
 */
export function MundoDeporte({ codigo, width, height, activo = true, apagado = false }) {
  const m = MUNDOS[codigo] ?? MUNDO_DEFECTO;
  const r = RECORRIDOS[codigo] ?? RECORRIDOS.DEPORTE_FRONTON;
  const t = useRef(new Animated.Value(0)).current;
  const brillo = useRef(new Animated.Value(0)).current;
  const particulas = useRef(Array.from({ length: 7 }, () => new Animated.Value(Math.random()))).current;

  useEffect(() => {
    if (!activo) return undefined;
    const pelota = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: apagado ? 2600 : 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    const pulso = Animated.loop(Animated.sequence([
      Animated.timing(brillo, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(brillo, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ]));
    const flotar = particulas.map((p, i) => Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 1, duration: 5000 + i * 700, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(p, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])));
    pelota.start(); pulso.start(); flotar.forEach(a => a.start());
    return () => { pelota.stop(); pulso.stop(); flotar.forEach(a => a.stop()); };
  }, [activo, apagado, t, brillo, particulas]);

  const entrada = [0, 0.25, 0.5, 0.75, 1];
  const TAM = Math.round(width * 0.075);
  const pos = (desfase) => {
    const v = desfase ? Animated.subtract(t, desfase).interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' }) : t;
    return {
      transform: [
        { translateX: v.interpolate({ inputRange: entrada, outputRange: r.x.map(x => x * width - TAM / 2) }) },
        { translateY: v.interpolate({ inputRange: entrada, outputRange: r.y.map(y => y * height - TAM / 2) }) },
        { scale: v.interpolate({ inputRange: entrada, outputRange: r.s }) },
      ],
    };
  };

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={m.fondo[0]} />
            <Stop offset="1" stopColor={m.fondo[1]} />
          </LinearGradient>
          <LinearGradient id="pared" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2A4560" />
            <Stop offset="1" stopColor="#1A2F45" />
          </LinearGradient>
          <RadialGradient id="foco" cx="50%" cy="10%" r="70%">
            <Stop offset="0" stopColor={m.acento} stopOpacity="0.28" />
            <Stop offset="1" stopColor={m.acento} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#cielo)" />
        <Ellipse cx={width / 2} cy={height * 0.05} rx={width * 0.7} ry={height * 0.45} fill="url(#foco)" />
        <Cancha codigo={codigo} w={width} h={height} m={m} />
        {/* reflectores */}
        <Circle cx={width * 0.08} cy={height * 0.06} r={5} fill="#FFFFFF" opacity={0.8} />
        <Circle cx={width * 0.92} cy={height * 0.06} r={5} fill="#FFFFFF" opacity={0.8} />
      </Svg>

      {/* brillo que respira */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: m.acento, opacity: brillo.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] }) }]}
      />

      {/* partículas flotando */}
      {particulas.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute', left: (width / 7) * i + 12, top: 0,
            width: 4, height: 4, borderRadius: 2, backgroundColor: m.acento,
            opacity: p.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.7, 0.7, 0] }),
            transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [height * 0.95, height * 0.05] }) }],
          }}
        />
      ))}

      {/* estela y pelota */}
      {[0.08, 0.04].map((d, i) => (
        <Animated.View key={d} pointerEvents="none"
          style={[styles.pelota, { width: TAM, height: TAM, borderRadius: TAM / 2, backgroundColor: m.pelota, opacity: 0.18 + i * 0.12 }, pos(d)]} />
      ))}
      <Animated.View pointerEvents="none"
        style={[styles.pelota, { width: TAM, height: TAM, borderRadius: TAM / 2, backgroundColor: m.pelota }, pos(0)]}>
        <View style={[styles.costura, { borderColor: codigo === 'DEPORTE_FRONTON' ? '#9AA5A0' : '#B9C72A' }]} />
      </Animated.View>

      {apagado && <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.apagado]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  pelota: {
    position: 'absolute', left: 0, top: 0,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  costura: { width: '70%', height: '70%', borderRadius: 999, borderWidth: 1.5, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  apagado: { backgroundColor: 'rgba(5,10,18,0.55)' },
});
