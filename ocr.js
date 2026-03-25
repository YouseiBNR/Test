/**
 * OCRモジュール - データカウンターの写真から数値を読み取る
 * Tesseract.js を使用したクライアントサイドOCR
 */

/**
 * 画像からOCRで数値を読み取る
 * @param {File|Blob|string} imageSource - 画像ファイル or URL
 * @returns {Promise<Object>} 読み取り結果
 */
async function performOCR(imageSource) {
  const statusEl = document.getElementById('ocr-status');
  if (statusEl) statusEl.textContent = 'OCRエンジンを初期化中...';

  try {
    const worker = await Tesseract.createWorker('jpn+eng', 1, {
      logger: (m) => {
        if (statusEl && m.status) {
          const progress = m.progress ? ` (${Math.round(m.progress * 100)}%)` : '';
          statusEl.textContent = `${m.status}${progress}`;
        }
      }
    });

    // 数字認識に最適化されたパラメータ
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789/.:-BGREビッグレギュラー回転総合算確率',
      tessedit_pageseg_mode: '6', // 単一ブロックとして認識
    });

    if (statusEl) statusEl.textContent = '画像を解析中...';
    const { data } = await worker.recognize(imageSource);

    await worker.terminate();

    if (statusEl) statusEl.textContent = '数値を抽出中...';

    const extracted = extractDataFromText(data.text);
    extracted.rawText = data.text;
    extracted.confidence = data.confidence;

    if (statusEl) statusEl.textContent = '';
    return extracted;
  } catch (error) {
    if (statusEl) statusEl.textContent = `OCRエラー: ${error.message}`;
    throw error;
  }
}

/**
 * OCRテキストからデータカウンターの数値を抽出
 * 複数のパターンに対応して堅牢な抽出を行う
 */
function extractDataFromText(text) {
  const result = {
    totalGames: null,
    bbCount: null,
    rbCount: null,
    parsed: false,
    patterns: []
  };

  // テキストの前処理
  const cleanText = text
    .replace(/[Oo]/g, '0')  // O→0の誤認識補正
    .replace(/[lI|]/g, '1') // l,I,|→1の誤認識補正
    .replace(/[Ss]/g, '5')  // S→5の誤認識補正
    .replace(/[Bb]/g, '8')  // B→8の誤認識補正（数字文脈のみ）
    .replace(/\s+/g, ' ');

  // パターン1: "総回転 XXXX" 形式
  const totalGamesPatterns = [
    /(?:総回転|総ゲーム|TOTAL|G数|回転数|ゲーム数)[:\s]*(\d+)/i,
    /(\d{3,5})\s*(?:G|回転|ゲーム)/i,
  ];

  // パターン2: "BB XX" 形式
  const bbPatterns = [
    /(?:BB|BIG|ビッグ|ＢＢ|ＢＩＧ)[:\s]*(\d+)/i,
    /(?:B[:\s]*)(\d{1,3})(?:\s|$)/i,
  ];

  // パターン3: "RB XX" 形式
  const rbPatterns = [
    /(?:RB|REG|レギュラー|ＲＢ|ＲＥＧ)[:\s]*(\d+)/i,
    /(?:R[:\s]*)(\d{1,3})(?:\s|$)/i,
  ];

  // 各パターンを試行
  for (const pattern of totalGamesPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      result.totalGames = parseInt(match[1], 10);
      result.patterns.push(`総回転: ${pattern.source}`);
      break;
    }
  }

  for (const pattern of bbPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      result.bbCount = parseInt(match[1], 10);
      result.patterns.push(`BB: ${pattern.source}`);
      break;
    }
  }

  for (const pattern of rbPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      result.rbCount = parseInt(match[1], 10);
      result.patterns.push(`RB: ${pattern.source}`);
      break;
    }
  }

  // フォールバック: テキスト内の数字列を全て抽出
  if (!result.totalGames || !result.bbCount || !result.rbCount) {
    const allNumbers = cleanText.match(/\d+/g);
    if (allNumbers) {
      const nums = allNumbers.map(n => parseInt(n, 10)).filter(n => n > 0);
      result.allDetectedNumbers = nums;

      // ヒューリスティック: 最大の数字が総回転数の可能性が高い
      if (!result.totalGames && nums.length > 0) {
        const maxNum = Math.max(...nums);
        if (maxNum >= 100) {
          result.totalGames = maxNum;
          result.patterns.push('総回転: heuristic(max)');
        }
      }
    }
  }

  result.parsed = !!(result.totalGames && result.bbCount !== null && result.rbCount !== null);

  return result;
}

/**
 * 画像の前処理（コントラスト強調等）を行い、OCR精度を向上させる
 */
function preprocessImage(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // グレースケール変換 + コントラスト強調
  for (let i = 0; i < data.length; i += 4) {
    // グレースケール
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // コントラスト強調（データカウンターの蛍光表示に最適化）
    const contrast = 1.5;
    const adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255;

    // 二値化（閾値: 128）
    const binarized = adjusted > 128 ? 255 : 0;

    data[i] = binarized;
    data[i + 1] = binarized;
    data[i + 2] = binarized;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export { performOCR, extractDataFromText, preprocessImage };
