
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { JournalEntry } from '../types';
import { format } from 'date-fns';
import { BookOpen, PenTool, Send, History, CheckCircle2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface EmotionalJournalProps {
    entries: JournalEntry[];
    onSave: (content: string) => Promise<void>;
    isSubmitting: boolean;
}

const EmotionalJournal: React.FC<EmotionalJournalProps> = ({ entries, onSave, isSubmitting }) => {
    const [content, setContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        await onSave(content);
        setContent('');
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Input Section */}
                <Card className="w-full md:w-5/12 border-primary/10 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-fit sticky top-24">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <PenTool className="h-5 w-5" /> Express Yourself
                        </CardTitle>
                        <CardDescription>
                            Write down your emotional responses or any thoughts important to you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Textarea
                                placeholder="How are you feeling right now? What's on your mind?"
                                className="min-h-[200px] bg-white/50 dark:bg-gray-900/50 border-primary/5 focus:border-primary/20 transition-all text-base leading-relaxed"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <Button
                                type="submit"
                                className="w-full py-6 text-lg font-bold"
                                disabled={isSubmitting || !content.trim()}
                            >
                                {isSubmitting ? 'Saving...' : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" /> Save Entry
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* History Section */}
                <div className="w-full md:w-7/12 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                            <History className="h-5 w-5" /> Your Journal History
                        </h3>
                        <Badge variant="outline" className="bg-primary/5 border-primary/10">
                            {entries.length} Entries
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {entries.length > 0 ? (
                            [...entries].reverse().map((entry, index) => {
                                const actualIndex = entries.length - index;
                                return (
                                    <Card key={index} className="border-primary/5 shadow-md bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm group hover:border-primary/20 transition-all duration-300">
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-primary/60" />
                                                    <span className="font-black text-primary/80 uppercase tracking-tighter text-sm">
                                                        Entry #{actualIndex}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium italic">
                                                    {format(new Date(entry.date), 'MMMM d, yyyy • h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium font-serif bg-primary/5 p-4 rounded-xl border border-primary/5">
                                                "{entry.content}"
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-20 bg-white/20 dark:bg-gray-800/20 rounded-3xl border border-dashed border-primary/20">
                                <BookOpen className="h-12 w-12 mx-auto text-primary/20 mb-4" />
                                <p className="text-muted-foreground italic font-medium">Your journaling journey begins with your first entry.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmotionalJournal;
