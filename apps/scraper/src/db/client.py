"""PostgreSQL database client for scraper."""
import os
import asyncio
import logging
from typing import Optional, Dict, Any
import psycopg2
from psycopg2 import pool, sql
from psycopg2.extras import RealDictCursor
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

logger = logging.getLogger(__name__)


class DatabaseClient:
    """PostgreSQL connection pool and operations."""

    _instance: Optional['DatabaseClient'] = None
    _pool: Optional[pool.ThreadedConnectionPool] = None

    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize database connection pool."""
        if self._pool is not None:
            return

        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")

        try:
            self._pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=database_url,
                cursor_factory=RealDictCursor,
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    def get_connection(self):
        """Get a connection from the pool with retry logic."""
        if self._pool is None:
            raise RuntimeError("Database pool not initialized")
        return self._pool.getconn()

    def release_connection(self, conn):
        """Release a connection back to the pool."""
        if self._pool and conn:
            self._pool.putconn(conn)

    def upsert_product(self, product_data: Dict[str, Any]) -> bool:
        """
        Upsert product into database.

        Uses ON CONFLICT to handle duplicates gracefully.
        Updates only if product is in DRAFT status.

        Args:
            product_data: Dictionary containing product fields

        Returns:
            True if successful, False otherwise
        """
        conn = None
        try:
            conn = self.get_connection()

            with conn.cursor() as cursor:
                query = sql.SQL("""
                    INSERT INTO "Product"
                        (id, title, price, "imageUrl", imageLocal, description,
                        hash, status, "sourceUrl", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (hash) DO UPDATE
                    SET price = EXCLUDED.price,
                        title = EXCLUDED.title,
                        "imageUrl" = EXCLUDED."imageUrl",
                        imageLocal = EXCLUDED.imageLocal,
                        description = EXCLUDED.description,
                        "updatedAt" = NOW()
                    WHERE "Product".status = 'DRAFT'
                    RETURNING (xmax = 0) AS inserted
                """)

                cursor.execute(
                    query,
                    (
                        product_data.get('id'),
                        product_data.get('title'),
                        product_data.get('price'),
                        product_data.get('image_url'),
                        product_data.get('image_local'),
                        product_data.get('description'),
                        product_data.get('hash'),
                        'DRAFT',
                        product_data.get('source_url'),
                    )
                )

                result = cursor.fetchone()
                conn.commit()

                is_new = result['inserted'] == 1
                action = "Inserted" if is_new else "Updated"
                logger.info(f"{action} product: {product_data.get('title')} (hash: {product_data.get('hash')[:16]}...)")

                return True

        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Failed to upsert product: {e}", exc_info=True)
            return False
        finally:
            if conn:
                self.release_connection(conn)

    def get_products_count(self) -> int:
        """Get total number of products in database."""
        conn = None
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute('SELECT COUNT(*) as count FROM "Product"')
                result = cursor.fetchone()
                return result['count']
        except Exception as e:
            logger.error(f"Failed to get products count: {e}")
            return 0
        finally:
            if conn:
                self.release_connection(conn)

    def close(self):
        """Close all connections in the pool."""
        if self._pool:
            self._pool.closeall()
            logger.info("Database connection pool closed")


# Global database client instance
db = DatabaseClient()
