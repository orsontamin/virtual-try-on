import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Toolbar from './Toolbar';

// Mock canvas object
const mockCanvas = {
  add: vi.fn(),
  setActiveObject: vi.fn(),
  getObjects: vi.fn().mockReturnValue([]),
  remove: vi.fn(),
  toDataURL: vi.fn(),
};

describe('Toolbar Component', () => {
  it('renders sticker section and core actions', () => {
    render(<Toolbar canvas={mockCanvas} />);
    
    expect(screen.getByText('Add Sticker')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
    expect(screen.getByText('Save Image')).toBeInTheDocument();
  });

  it('calls clearCanvas logic when Clear All is clicked', () => {
    const mockObj = { selectable: true };
    mockCanvas.getObjects.mockReturnValue([mockObj]);
    
    render(<Toolbar canvas={mockCanvas} />);
    
    const clearBtn = screen.getByText('Clear All');
    fireEvent.click(clearBtn);

    expect(mockCanvas.getObjects).toHaveBeenCalled();
    expect(mockCanvas.remove).toHaveBeenCalledWith(mockObj);
  });
});
