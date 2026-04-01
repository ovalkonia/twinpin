import { useState } from 'react';
import { IconChevronDown } from '../../assets/icons.tsx';

interface Props {
    faq: { question: string; answer: string }[];
}

export default function EventFaq({ faq }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="event-faq">
            <h3 className="event-section-title">FAQ</h3>
            <div className="event-faq-list">
                {faq.map((item, i) => (
                    <div
                        key={i}
                        className={`event-faq-item${openIndex === i ? ' open' : ''}`}
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    >
                        <div className="event-faq-question">
                            <span>{item.question}</span>
                            <span className={`event-faq-chevron${openIndex === i ? ' rotated' : ''}`}>
                                <IconChevronDown size={16} />
                            </span>
                        </div>
                        <div className="event-faq-answer">
                            <p>{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}