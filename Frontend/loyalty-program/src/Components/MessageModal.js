import React from 'react';
import './MessageModal.css';

const MessageModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'Confirm' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <i className="fas fa-exclamation-circle" style={{ color: 'var(--color-brand-red)' }}></i>;
            case 'warning':
                return <i className="fas fa-exclamation-triangle" style={{ color: 'var(--color-brand-orange)' }}></i>;
            case 'success':
                return <i className="fas fa-check-circle" style={{ color: 'var(--color-success)' }}></i>;
            default:
                return <i className="fas fa-info-circle" style={{ color: 'var(--color-brand-blue)' }}></i>;
        }
    };

    return (
        <div className="message-modal-overlay" onClick={onClose}>
            <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="message-modal-header">
                    <h2>{title}</h2>
                    <button className="message-modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="message-modal-body">
                    <div className="message-icon">
                        {getIcon()}
                    </div>
                    <p>{message}</p>
                </div>
                <div className="message-modal-actions">
                    {onConfirm ? (
                        <>
                            <button className="btn-secondary" onClick={onClose} style={{ marginRight: '1rem' }}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={() => {
                                onConfirm();
                                onClose();
                            }}>
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button className="btn-primary" onClick={onClose}>
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageModal;
