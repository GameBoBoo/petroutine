"use client";
import { useRef } from 'react';
import Icon from './Icon.jsx';

export default function SearchField({ value = '', onChange, ...props }) {
  const inputRef = useRef(null);
  return <span className="search-field">
    <Icon className="search-field-icon" name="search" size={19}/>
    <input {...props} ref={inputRef} type="search" value={value} onChange={onChange}/>
    {value && <button type="button" className="search-field-clear" aria-label="ล้างคำค้นหา" onClick={() => { onChange?.({ target: { value: '' } }); inputRef.current?.focus(); }}><Icon name="close" size={16}/></button>}
  </span>;
}
