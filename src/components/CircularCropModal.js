import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Image, Modal, StyleSheet, Text, TouchableOpacity,
  PanResponder, Dimensions, StatusBar, ActivityIndicator,
} from 'react-native';
import Svg, { Defs, Mask, Circle, Rect } from 'react-native-svg';
import { colors } from '../constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CROP_RADIUS = Math.min(SCREEN_W * 0.40, 160);
const CIRCLE_CX   = SCREEN_W / 2;
const CIRCLE_Y    = 90 + (SCREEN_H - 90 - 210) / 2; // centrado entre topBar y controles

export function CircularCropModal({ visible, imageUri, onCancel, onCrop }) {
  const [imgSize, setImgSize] = useState(null); // { w, h, fillScale }
  const [scale,   setScale]   = useState(1);
  const [pan,     setPan]     = useState({ x: 0, y: 0 }); // offset desde centro del círculo

  const panRef   = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  useEffect(() => {
    if (!imageUri || !visible) { setImgSize(null); return; }
    setImgSize(null);
    Image.getSize(imageUri, (w, h) => {
      const fillScale = Math.max((CROP_RADIUS * 2) / w, (CROP_RADIUS * 2) / h);
      scaleRef.current = fillScale;
      panRef.current   = { x: 0, y: 0 };
      setImgSize({ w, h, fillScale });
      setScale(fillScale);
      setPan({ x: 0, y: 0 });
    }, () => {});
  }, [imageUri, visible]);

  // Clamp simple: la imagen no puede alejarse más de lo que cubre el círculo
  function clamp(px, py, s, w, h) {
    const halfW = (w * s) / 2;
    const halfH = (h * s) / 2;
    // Máximo desplazamiento: borde de imagen toca borde del círculo
    const maxX = Math.max(0, halfW - CROP_RADIUS);
    const maxY = Math.max(0, halfH - CROP_RADIUS);
    return {
      x: Math.max(-maxX, Math.min(maxX, px)),
      y: Math.max(-maxY, Math.min(maxY, py)),
    };
  }

  const panResponder = useMemo(() => {
    if (!imgSize) return null;
    const { w, h } = imgSize;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        startRef.current = { ...panRef.current };
      },
      onPanResponderMove: (_, gs) => {
        const c = clamp(
          startRef.current.x + gs.dx,
          startRef.current.y + gs.dy,
          scaleRef.current,
          w, h,
        );
        panRef.current = c;
        setPan(c);
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSize?.w, imgSize?.h]);

  function adjustScale(factor) {
    if (!imgSize) return;
    const { w, h, fillScale } = imgSize;
    const newS = Math.max(fillScale * 0.4, Math.min(scaleRef.current * factor, fillScale * 8));
    const c = clamp(panRef.current.x, panRef.current.y, newS, w, h);
    scaleRef.current = newS;
    panRef.current   = c;
    setScale(newS);
    setPan(c);
  }

  function getCropParams() {
    if (!imgSize) return null;
    const { w, h } = imgSize;
    const s  = scaleRef.current;
    const px = panRef.current.x;
    const py = panRef.current.y;
    const cropW = Math.round(CROP_RADIUS * 2 / s);
    const cropX = Math.max(0, Math.round(w / 2 - CROP_RADIUS / s - px / s));
    const cropY = Math.max(0, Math.round(h / 2 - CROP_RADIUS / s - py / s));
    return {
      x: cropX,
      y: cropY,
      w: Math.min(cropW, w - cropX),
      h: Math.min(cropW, h - cropY),
      naturalW: w,
      naturalH: h,
    };
  }

  const imgW = imgSize ? imgSize.w * scale : 0;
  const imgH = imgSize ? imgSize.h * scale : 0;
  // La imagen se posiciona centrada en (CIRCLE_CX, CIRCLE_Y) + pan
  const imgLeft = CIRCLE_CX - imgW / 2 + pan.x;
  const imgTop  = CIRCLE_Y  - imgH / 2 + pan.y;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.container}>

        {/* Imagen posicionada explícitamente centrada en el círculo */}
        {imgSize ? (
          <View style={styles.imgLayer} {...(panResponder?.panHandlers ?? {})}>
            <Image
              source={{ uri: imageUri }}
              style={{
                position: 'absolute',
                left:   imgLeft,
                top:    imgTop,
                width:  imgW,
                height: imgH,
              }}
            />
          </View>
        ) : (
          <ActivityIndicator size="large" color="#fff" />
        )}

        {/* Máscara circular SVG */}
        <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Mask id="hole">
              <Rect width={SCREEN_W} height={SCREEN_H} fill="white" />
              <Circle cx={CIRCLE_CX} cy={CIRCLE_Y} r={CROP_RADIUS} fill="black" />
            </Mask>
          </Defs>
          <Rect width={SCREEN_W} height={SCREEN_H} fill="rgba(0,0,0,0.65)" mask="url(#hole)" />
          <Circle cx={CIRCLE_CX} cy={CIRCLE_Y} r={CROP_RADIUS} fill="transparent" stroke="white" strokeWidth={2} />
        </Svg>

        {/* Barra superior */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>Ajusta tu foto</Text>
          <View style={{ width: 70 }} />
        </View>

        {imgSize && (
          <>
            <View style={styles.zoomRow}>
              <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustScale(0.80)}>
                <Text style={styles.zoomIcon}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustScale(1.25)}>
                <Text style={styles.zoomIcon}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.cropBtn} onPress={() => onCrop(imageUri, getCropParams())}>
                <Text style={styles.cropBtnText}>Usar esta foto</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cancelText: { color: '#fff', fontSize: 16 },
  titleText:  { color: '#fff', fontSize: 17, fontWeight: '600' },
  zoomRow: {
    position: 'absolute',
    bottom: 110,
    flexDirection: 'row',
    gap: 28,
  },
  zoomBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIcon: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 36 },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cropBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 56,
    minWidth: 220,
    alignItems: 'center',
    elevation: 4,
  },
  cropBtnText: { fontSize: 16, fontWeight: '600', color: colors.primary },
});
