import { useState } from 'react';
import { getStockDisplayText, isProductInStock } from '../utils/inventoryService';

export function ProductCard({ product, compact = false, badge = null, tagLabel = null, onClick }) {
    const rating = Number(product.averageRating || product.rating) || 0;
    const inStock = isProductInStock(product);

    return (
        <article className="p-card" onClick={onClick}>
            {/* Badges */}
            {product.tag?.toLowerCase() === 'hot' || tagLabel === 'Hot' ? (
                <span className="p-badge hot">🔥 Hot</span>
            ) : product.tag?.toLowerCase() === 'new' || tagLabel === 'New' || badge ? (
                <span className="p-badge new">{badge || 'NEW'}</span>
            ) : product.category ? (
                <span className="p-badge">{product.category.split(' ')[0]}</span>
            ) : null}

            <button 
                className="p-wishlist" 
                aria-label="Add to wishlist"
                onClick={e => {
                    e.stopPropagation();
                    // Toggle wishlist logic could go here
                }}
            >
                <i className="fa-regular fa-heart"></i>
            </button>

            <div className="p-img">
                <img 
                    src={product.img || product.images?.[0] || 'https://via.placeholder.com/400'} 
                    alt={product.name} 
                    loading="lazy" 
                />
            </div>

            <div className="p-body">
                <div className="p-rating">
                    <span className="p-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                            <i
                                key={star}
                                className={star <= rating ? 'fas fa-star' : star - 0.5 <= rating ? 'fas fa-star-half-alt' : 'far fa-star'}
                                style={{ color: star <= rating || star - 0.5 <= rating ? '#F5A623' : '#2A2A30' }}
                            ></i>
                        ))}
                    </span>
                    <span className="p-reviews">({product.reviewCount || product.numReviews || 0})</span>
                </div>

                <h3 className="p-name">{product.name}</h3>

                <p className="p-installment">
                    <i className="fa-solid fa-circle-check"></i> From ₦{(Math.floor((product.pss || product.price) / 12)).toLocaleString()}/mo · 12 months
                </p>

                <div className="p-foot">
                    <div>
                        {product.pss && product.pss > 0 && Number(product.pss) < Number(product.price) && (
                            <div className="p-old-price">₦{Number(product.price).toLocaleString()}</div>
                        )}
                        <div className="p-price">₦{Number(product.pss && product.pss > 0 ? product.pss : product.price).toLocaleString()}</div>
                    </div>
                    
                    <button 
                        className="p-cart-btn" 
                        aria-label="Add to cart"
                        disabled={!inStock}
                        onClick={e => { 
                            e.stopPropagation(); 
                            if(inStock && onClick) onClick(); 
                        }}
                    >
                        <i className={`fa-solid ${inStock ? 'fa-plus' : 'fa-xmark'}`}></i>
                    </button>
                </div>
            </div>
        </article>
    );
}

export function SkeletonCard({ compact = false }) {
    return (
        <article className="p-card">
            <div className="p-img" style={{
                background: 'linear-gradient(90deg,#1E1E22 25%,#2A2A30 50%,#1E1E22 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite'
            }}></div>
            <div className="p-body">
                <div style={{ height: 12, background: '#1E1E22', borderRadius: 4, marginBottom: 8, width: '40%' }} />
                <div style={{ height: 16, background: '#1E1E22', borderRadius: 4, marginBottom: 12, width: '90%' }} />
                <div style={{ height: 12, background: '#1E1E22', borderRadius: 4, marginBottom: 'auto', width: '70%' }} />
                <div className="p-foot" style={{ marginTop: 'auto', borderTop: 'none', paddingTop: 10 }}>
                    <div style={{ height: 24, background: '#1E1E22', borderRadius: 6, width: '50%' }} />
                    <div style={{ height: 38, width: 38, background: '#1E1E22', borderRadius: 8 }} />
                </div>
            </div>
        </article>
    );
}
