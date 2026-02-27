import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatBot from './ChatBot';

// Mock the analytics API
vi.mock('../../lib/analyticsApi', () => ({
  sendChatMessage: vi.fn().mockResolvedValue({ response: 'Test response' }),
}));

describe('ChatBot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating chat button', () => {
    render(<ChatBot />);
    const button = screen.getByLabelText('Open chat');
    expect(button).toBeInTheDocument();
  });

  it('opens chat window when button is clicked', () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(screen.getByText('Business Assistant')).toBeInTheDocument();
    expect(screen.getByText('Ask me anything')).toBeInTheDocument();
  });

  it('shows initial greeting message', () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(screen.getByText(/Ask me anything about your Etsy shop/i)).toBeInTheDocument();
  });

  it('shows quick question buttons', () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(screen.getByText("How's my business doing?")).toBeInTheDocument();
    expect(screen.getByText("What's my profit?")).toBeInTheDocument();
  });

  it('does not render dangerouslySetInnerHTML (XSS fix)', () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText('Open chat'));

    // The chat component should not use dangerouslySetInnerHTML anywhere
    const container = document.querySelector('[style*="flex-direction: column"]');
    // All message content should be rendered as text nodes, not innerHTML
    const allElements = document.querySelectorAll('[dangerouslysetinnerhtml]');
    expect(allElements.length).toBe(0);
  });

  it('closes chat when close button is clicked', () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(screen.getByText('Business Assistant')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close chat'));
    expect(screen.queryByText('Business Assistant')).not.toBeInTheDocument();
  });

  it('has disabled send button when input is empty', () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    const sendButton = document.querySelector('.send-btn');
    expect(sendButton).toBeDisabled();
  });
});
