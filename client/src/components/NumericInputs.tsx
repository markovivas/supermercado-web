import React, { useState, useEffect } from 'react';

interface PriceInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

export const PriceInput: React.FC<PriceInputProps> = ({ value, onChange, className }) => {
  const [text, setText] = useState<string>(value > 0 ? value.toFixed(2) : '');

  useEffect(() => {
    const clean = text.replace(',', '.');
    const parsed = parseFloat(clean);
    // Só sincroniza se o valor externo mudou e não bate com o que o usuário está digitando
    if (isNaN(parsed) || Math.abs(parsed - value) > 0.001) {
      setText(value > 0 ? value.toFixed(2) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);

    const clean = raw.replace(',', '.').trim();
    if (clean === '') {
      onChange(0);
      return;
    }

    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const clean = text.replace(',', '.').trim();
    const parsed = parseFloat(clean);
    if (isNaN(parsed) || parsed <= 0) {
      setText(value > 0 ? value.toFixed(2) : '0,00');
      onChange(value > 0 ? value : 0);
    } else {
      setText(parsed.toFixed(2));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0,00"
      className={className}
    />
  );
};

interface QuantityInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({ value, onChange, className }) => {
  const [text, setText] = useState<string>(value.toString());

  useEffect(() => {
    const clean = text.replace(',', '.');
    const parsed = parseFloat(clean);
    if (isNaN(parsed) || Math.abs(parsed - value) > 0.0001) {
      setText(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);

    const clean = raw.replace(',', '.').trim();
    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const clean = text.replace(',', '.').trim();
    const parsed = parseFloat(clean);
    if (isNaN(parsed) || parsed <= 0) {
      setText(value > 0 ? value.toString() : '1');
      onChange(value > 0 ? value : 1);
    } else {
      setText(parsed.toString());
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};
