// components/EmailProgressModal.js
import React from 'react';

const EmailProgressModal = ({ 
  isVisible, 
  progress, 
  total, 
  currentEmail, 
  successCount, 
  failedCount,
  onClose 
}) => {
  if (!isVisible) return null;

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const isComplete = progress >= total;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{borderRadius: '16px'}}>
          <div className="modal-header" style={{
            borderRadius: '16px 16px 0 0', 
            backgroundColor: '#284C9A', 
            color: 'white'
          }}>
            <h5 className="modal-title fw-bold">
              <i className="bi bi-envelope-fill me-2"></i>
              {isComplete ? 'Email Sending Complete!' : 'Sending Login Credentials'}
            </h5>
            {isComplete && (
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            )}
          </div>
          
          <div className="modal-body text-center py-4">
            {!isComplete ? (
              <>
                {/* Sending in progress */}
                <div className="mb-4">
                  <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
                    <span className="visually-hidden">Sending...</span>
                  </div>
                  <h6 className="fw-semibold mb-2">Sending emails to users...</h6>
                  <p className="text-muted small mb-0">
                    Current: <span className="fw-semibold">{currentEmail}</span>
                  </p>
                </div>
                
                {/* Progress bar */}
                <div className="progress mb-4" style={{height: '12px', borderRadius: '6px'}}>
                  <div 
                    className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
                    role="progressbar"
                    style={{width: `${percentage}%`, borderRadius: '6px'}}
                  ></div>
                </div>
                
                {/* Progress stats */}
                <div className="row text-center">
                  <div className="col-4">
                    <div className="p-2">
                      <div className="fw-bold fs-5">{progress}/{total}</div>
                      <small className="text-muted">Progress</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2">
                      <div className="fw-bold fs-5 text-success">{successCount}</div>
                      <small className="text-muted">Sent</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2">
                      <div className="fw-bold fs-5 text-danger">{failedCount}</div>
                      <small className="text-muted">Failed</small>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <small className="text-muted">
                    Please wait... This may take a few minutes depending on the number of users.
                  </small>
                </div>
              </>
            ) : (
              <>
                {/* Completed */}
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success mb-3" style={{fontSize: '4rem'}}></i>
                  <h5 className="fw-bold text-success mb-2">Email Sending Complete!</h5>
                  <p className="text-muted">All user credentials have been processed.</p>
                </div>
                
                {/* Final results */}
                <div className="row text-center mb-4">
                  <div className="col-6">
                    <div className="p-3 bg-success bg-opacity-10 rounded-3">
                      <i className="bi bi-check-circle-fill text-success fs-3 mb-2"></i>
                      <div className="fw-bold text-success fs-4">{successCount}</div>
                      <small className="text-muted">Successfully Sent</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-danger bg-opacity-10 rounded-3">
                      <i className="bi bi-x-circle-fill text-danger fs-3 mb-2"></i>
                      <div className="fw-bold text-danger fs-4">{failedCount}</div>
                      <small className="text-muted">Failed to Send</small>
                    </div>
                  </div>
                </div>
                
                {/* Instructions for users */}
                <div className="alert alert-info text-start">
                  <h6 className="fw-semibold mb-2">
                    <i className="bi bi-info-circle me-2"></i>
                    What happens next:
                  </h6>
                  <ul className="mb-0 small">
                    <li>Users will receive their login credentials via email</li>
                    <li>They must change their password on first login</li>
                    <li>Accounts are set to "pending activation" status</li>
                    {failedCount > 0 && (
                      <li className="text-danger">
                        <strong>Note:</strong> {failedCount} emails failed - you may need to send credentials manually
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
          
          {isComplete && (
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-primary px-4"
                onClick={onClose}
              >
                <i className="bi bi-check-lg me-2"></i>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailProgressModal;